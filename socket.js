const cards = require('./cards/cards')
const poker = require('./poker')
const admins = {}
const rooms = []

module.exports = (io) => {
    io.on('connection', (socket) => { 
        console.log(`Connection made with and ID ${socket.id} `)

        socket.on('create-room', (id, user) => {
            admins[user] = socket.id
            socket.join(`${id}`)
            var isexistroom = rooms.findIndex(e => e.admin == user)
            if(isexistroom > 0) 
            rooms[isexistroom].roomId = id
            else
            rooms.push({roomId: id, 
                admin: user, 
                seats: [], 
                pot: 0, 
                isAvailable: true, 
                raiseId: 0, 
                raiseAmount: 0,
                dealer: '',
                smallBlind: '',
                bigBlind: '',
                given3Card: false,
                given4Card: false,
                given5Card: false,
                cards: {},
                cardsOnTable: [],
                result: [],
                turn: 0,
                lastAction: {}
            })
        })

        socket.on('join-room', (id, user) => {
            admins[user] = socket.id
            if(io.sockets.adapter.rooms.get(`${id}`)) {
                var room_admin = rooms.filter(e => e.roomId == id)
                if(room_admin[0].isAvailable) {
                    if(admins) {
                        socket.emit('waiting-room')
                        socket.to(id).to(admins).emit('player-waiting', user)
                    } else socket.emit('admin-disconnected')
                } else socket.emit('already-started')
            } else socket.emit('invalid-room')
        })

        socket.on('allow-player', (user, roomid, coins) => {
            if(admins[user]) {
                var seats = rooms.filter(e => e.roomId == roomid)[0].seats
                socket.to(admins[user]).emit('granted', coins, roomid, seats)
            } 
        })

        socket.on('granted-join', (roomid) => {
            socket.join(roomid)
        })

        socket.on('reject-player', (user) => {
            if(admins[user])
            socket.to(admins[user]).emit('denied')
        })

        socket.on('seat-selected', (seat) => {
            var index = rooms.findIndex(e => e.roomId == seat.room)
            if(index != -1) {
                if(rooms[index].seats.filter(e => e.id == seat.id).length == 0)
                rooms[index].seats.push({id: seat.id, name: seat.nickname, coins: seat.coins, isFold: false})
                // else will inform to user the seat is booked
                io.sockets.in(rooms[index].roomId).emit('locked-seats', rooms[index].seats)
            } //if room id not exist will implement later
        })

        socket.on('game-started', (roomid) => {
            var idx = rooms.findIndex(e => e.roomId == roomid)
            rooms[idx].isAvailable = false
            socket.to(roomid).emit('game-started')
            
            rooms[idx].seats.sort((a, b) => (parseInt(a.id) - parseInt(b.id)))

            emitDealerSmallBigBlind(idx, roomid)
        })

        socket.on('after-bigblind', (roomid) => {
            var idx = rooms.findIndex(e => e.roomId == roomid)

            if(idx != -1) {
            cards.decks()
            cards.shuffleCards()

            rooms[idx].seats.forEach(ele => {
                var card1 = cards.deck.pop()
                var card2 = cards.deck.pop()
                rooms[idx].cards[ele.name] = []
                rooms[idx].cards[ele.name].push(card1, card2)
                if(socket.id == admins[ele.name])
                socket.emit('two-cards', card1, card2)
                else 
                socket.to(admins[ele.name]).emit('two-cards',card1, card2)
            })
            rooms[idx].raiseId = rooms[idx].seats[rooms[idx].seats.length - 2].id
            rooms[idx].raiseAmount = 2
            rooms[idx].lastAction = {}
            io.sockets.in(roomid).emit('last-action', rooms[idx].lastAction)
            io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Call')
        } 
        // else invalid room
        })

        socket.on('return-chance', (action, chance, amount, roomid) => {
            // console.log(action, chance, amount)

            var idx = rooms.findIndex(e => e.roomId == roomid)

            if(action != 'Fold') {
                if(amount != 0)
                rooms[idx].lastAction[chance] = action +'$'+parseInt(amount)
                else 
                rooms[idx].lastAction[chance] = action
                io.sockets.in(roomid).emit('last-action', rooms[idx].lastAction)
            }

            checkFoldandRotate(idx)

            var seatidx = rooms[idx].seats.findIndex(e => e.name == chance)

            if(action == 'Raise') {
                io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Call')
                rooms[idx].raiseId = rooms[idx].seats[seatidx].id
                rooms[idx].raiseAmount = parseInt(amount)

                rooms[idx].seats[seatidx].coins = parseInt(rooms[idx].seats[seatidx].coins) - parseInt(amount)
                rooms[idx].pot = parseInt(rooms[idx].pot) + parseInt(amount)

                io.sockets.in(roomid).emit('pot-seat', rooms[idx].pot, rooms[idx].seats)
            } else if(action == 'Check') {
                io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Check')
            } else if(action == 'Call') {
                rooms[idx].seats[seatidx].coins = parseInt(rooms[idx].seats[seatidx].coins) - parseInt(rooms[idx].raiseAmount)
                rooms[idx].pot = parseInt(rooms[idx].pot) + parseInt(rooms[idx].raiseAmount)
                io.sockets.in(roomid).emit('pot-seat', rooms[idx].pot, rooms[idx].seats)

                if(rooms[idx].raiseId == rooms[idx].seats[0].id) {
                    rooms[idx].raiseAmount = 0
                    rooms[idx].raiseId = 0
                    io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Check')
                } else {
                    io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Call')
                }
            } 
            else if(action == 'Fold') {
                delete rooms[idx].cards[chance]

                rooms[idx].seats[seatidx].isFold = true
                io.sockets.in(roomid).emit('pot-seat', rooms[idx].pot, rooms[idx].seats)

                if(rooms[idx].raiseId == rooms[idx].seats[0].id) {
                    rooms[idx].raiseAmount = 0
                    rooms[idx].raiseId = 0
                }

                var oneremain = rooms[idx].seats.filter(e => e.isFold == false)
                if(oneremain.length == 1) {
                    var seatindex = rooms[idx].seats.findIndex(e => e.name == oneremain[0].name)

                    rooms[idx].seats[seatindex].coins = parseInt(rooms[idx].seats[seatindex].coins) + parseInt(rooms[idx].pot)
                    io.sockets.in(rooms[idx].roomId).emit('winner', oneremain, rooms[idx].pot)
                    io.sockets.in(rooms[idx].roomId).emit('pot-seat', 0, rooms[idx].seats)
                    io.sockets.in(rooms[idx].roomId).emit('game-over')
                    clearData(idx)
                } else {
                    if(rooms[idx].raiseId == 0) 
                    io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Check')
                    else
                    io.sockets.in(roomid).emit('chance', rooms[idx].seats[0].name, 'Call')
                }
            }
        })

        function checkFoldandRotate(index) {
            rooms[index].seats.push(rooms[index].seats.shift())
            distributeCards(index)
            if(rooms[index].seats[0].isFold == true) { //check fold
            checkFoldandRotate(index)
            } else return
        }

        function distributeCards(index) {
            if(rooms[index].seats[0].name == rooms[index].dealer) {
                setTimeout(() => {
                    rooms[index].lastAction = {}
                    io.sockets.in(rooms[index].roomId).emit('last-action', rooms[index].lastAction)
                }, 2000)
                
                if(rooms[index].given3Card == false) {
                    var t_card1 = cards.deck.pop()
                    var t_card2 = cards.deck.pop()
                    var t_card3 = cards.deck.pop()
                    rooms[index].cardsOnTable.push(t_card1, t_card2, t_card3)
                    io.sockets.in(rooms[index].roomId).emit('first-3-cards', t_card1, t_card2, t_card3)
                    rooms[index].given3Card = true
                } else if(rooms[index].given3Card == true && rooms[index].given4Card == false) {
                    var t_card4 = cards.deck.pop()
                    rooms[index].cardsOnTable.push(t_card4)
                    io.sockets.in(rooms[index].roomId).emit('fourth-card', t_card4)
                    rooms[index].given4Card = true
                }else if(rooms[index].given3Card == true && rooms[index].given4Card == true && rooms[index].given5Card == false) {
                    var t_card5 = cards.deck.pop()
                    rooms[index].cardsOnTable.push(t_card5)
                    io.sockets.in(rooms[index].roomId).emit('fifth-card', t_card5)
                    rooms[index].given5Card = true
                } else if(rooms[index].given3Card == true && rooms[index].given4Card == true && rooms[index].given5Card == true) {
                    Object.keys(rooms[index].cards).forEach(key => {
                        var finalcards = [];
                        rooms[index].cardsOnTable.forEach(e => finalcards.push(e))
                        rooms[index].cards[key].forEach(e => finalcards.push({...e, user: true}))
                        console.log(finalcards, key)
                        poker.setCards(finalcards);
                        var result = poker.checkRank()
                        rooms[index].result.push({
                            name: key,
                            rank: result.rank,
                            sum: result.sum,
                            cards: result.cards,
                            message: result.message,
                            cardtotal : result.cardtotal
                        })
                    })
                    console.log(rooms[index].result)
                    var firstplace = rooms[index].result.reduce((prev, curr) => {
                        return curr.rank < prev.rank ? curr : prev
                    })

                    var first_player = rooms[index].result.filter(e => e.rank == firstplace.rank)
                    if(first_player.length == 1) {
                        var seatindex = rooms[index].seats.findIndex(e => e.name == first_player[0].name)

                        rooms[index].seats[seatindex].coins = parseInt(rooms[index].seats[seatindex].coins) + parseInt(rooms[index].pot)
                        io.sockets.in(rooms[index].roomId).emit('winner', first_player, rooms[index].pot)
                        io.sockets.in(rooms[index].roomId).emit('pot-seat', 0, rooms[index].seats)
                    } else if(first_player.length > 1) {
                        var sum = first_player.reduce((prev, curr) => {
                            return curr.sum > prev.sum ? curr : prev
                        })

                        var sum_player = first_player.filter(e => e.sum == sum.sum)
                        if(sum_player.length == 1) {
                            var seatindex = rooms[index].seats.findIndex(e => e.name == sum_player[0].name)

                            rooms[index].seats[seatindex].coins = parseInt(rooms[index].seats[seatindex].coins) + parseInt(rooms[index].pot)
                            io.sockets.in(rooms[index].roomId).emit('winner', sum_player, rooms[index].pot)
                            io.sockets.in(rooms[index].roomId).emit('pot-seat', 0, rooms[index].seats) 
                        } else if(sum_player.length > 1) {
                            var cardsum = sum_player.reduce((prev, curr) => {
                                return curr.cardtotal > prev.cardtotal ? curr : prev
                            })

                            var card_player = sum_player.filter(e => e.cardtotal == cardsum.cardtotal)
                            if(card_player.length == 1) {
                                var seatindex = rooms[index].seats.findIndex(e => e.name == card_player[0].name)

                                rooms[index].seats[seatindex].coins = parseInt(rooms[index].seats[seatindex].coins) + parseInt(rooms[index].pot)
                                io.sockets.in(rooms[index].roomId).emit('winner', card_player, rooms[index].pot)
                                io.sockets.in(rooms[index].roomId).emit('pot-seat', 0, rooms[index].seats) 
                            } else if(card_player.length >= 1) {
                                card_player.forEach((e, i) => {
                                var seatindex = rooms[index].seats.findIndex(e => e.name == card_player[i].name)
                                rooms[index].seats[seatindex].coins = parseInt(rooms[index].seats[seatindex].coins) + (parseInt(rooms[index].pot) / card_player.length)
                                })
                                console.log(rooms[index].pot);
                                io.sockets.in(rooms[index].roomId).emit('winner', card_player, (parseInt(rooms[index].pot) / card_player.length))
                                io.sockets.in(rooms[index].roomId).emit('pot-seat', 0, rooms[index].seats)
                                
                            }
                        }
                    }
                    io.sockets.in(rooms[index].roomId).emit('game-over')
                    clearData(index)
                }
            }
        }

        function clearData(index) {
            rooms[index].pot = 0
            rooms[index].cards = {}
            rooms[index].winner = []
            rooms[index].raiseId = 0 
            rooms[index].raiseAmount= 0
            rooms[index].dealer = ''
            rooms[index].smallBlind = ''
            rooms[index].bigBlind = ''
            rooms[index].given3Card = false
            rooms[index].given4Card = false
            rooms[index].given5Card = false
            rooms[index].cards = {}
            rooms[index].cardsOnTable = []
            rooms[index].result = []
            rooms[index].lastAction = {}
        }

        socket.on('deal-again', (id) => {
            var index = rooms.findIndex(e => e.roomId == id)

            io.sockets.in(id).emit('re-match')
            rooms[index].turn += 1
            rooms[index].seats.sort((a, b) => (parseInt(a.id) - parseInt(b.id)))
            for(var t = 0; t < rooms[index].turn; t++) {
                rooms[index].seats.push(rooms[index].seats.shift())
            }
            rooms[index].seats.forEach(e => e.isFold = false)
            io.sockets.in(id).emit('pot-seat', rooms[index].pot, rooms[index].seats)
            emitDealerSmallBigBlind(index, id)
        })

        function emitDealerSmallBigBlind(idx, roomid) {
            rooms[idx].dealer = rooms[idx].seats[0].name
            io.sockets.in(roomid).emit('dealer', rooms[idx].dealer)

            //emitting smallblind
            setTimeout(() => {
                rooms[idx].smallBlind = rooms[idx].seats[rooms[idx].seats.length - 2].name
                rooms[idx].seats[rooms[idx].seats.length - 2].coins -= 1
                rooms[idx].pot += 1
                io.sockets.in(roomid).emit('small-blind', rooms[idx].smallBlind)
                io.sockets.in(roomid).emit('pot-seat', rooms[idx].pot, rooms[idx].seats)
                rooms[idx].lastAction[rooms[idx].seats[rooms[idx].seats.length - 2].name] = 'SmallBlind $1'
                io.sockets.in(roomid).emit('last-action', rooms[idx].lastAction)
            }, 1000)

            //emitting bigblind
            setTimeout(() => {
                rooms[idx].bigBlind = rooms[idx].seats[rooms[idx].seats.length - 1].name
                rooms[idx].seats[rooms[idx].seats.length - 1].coins -= 2
                rooms[idx].pot += 2
                io.sockets.in(roomid).emit('big-blind', rooms[idx].bigBlind)
                io.sockets.in(roomid).emit('pot-seat', rooms[idx].pot, rooms[idx].seats)
                rooms[idx].lastAction[rooms[idx].seats[rooms[idx].seats.length - 1].name] = 'BigBlind $2'
                io.sockets.in(roomid).emit('last-action', rooms[idx].lastAction)
            }, 2000)
        }

        socket.on('disconnect', () => {
            console.log(socket.id, 'was disconnected')
            var key = Object.keys(admins).find(key => admins[key] == socket.id)
            delete admins[key]
        })
    })

}