var array_cards = []
var card_total = 0

module.exports.setCards = function (data) {
    array_cards = data
    card_total = 0

    array_cards.forEach(e => {
        card_total += e.rank
    })
}

function checkFlush() {
    var array_cards_suit = []; 
    var duplicate_suits = []; 
    var result = false;
    var rank_data = 0;

    array_cards.forEach(e => {
        array_cards_suit.push(e.suit)
    })

    for(var i = 0; i <= array_cards_suit.length - 1; i++) {
        for(var j = i+1; j <= array_cards_suit.length -1; j++) {
            if(array_cards_suit[i] ==  array_cards_suit[j]) {
                if(!duplicate_suits.includes(array_cards_suit[j])) {
                    duplicate_suits.push(array_cards_suit[j])
                }
            }
        }
    }

    duplicate_suits.forEach(e => {
        var fil = array_cards_suit.filter(el => el == e)
        if(fil && fil.length >= 5) {
            array_cards.filter(ele => {
                if(ele.suit == e)
                rank_data += ele.rank
            })
            result = true
        }
    })

    if(result == true)
    return {result: result, data: rank_data};
    else return {result: false, data: 0}
}

function checkRoyal() {
    var array_cards_rank = [];

    array_cards.forEach(e => {
        array_cards_rank.push(e.rank)
    })

    if(array_cards_rank.includes(14) && array_cards_rank.includes(13) && array_cards_rank.includes(12)
    && array_cards_rank.includes(11) && array_cards_rank.includes(10)) {
        return {result: true, data: 60}
    } else return {result: false, data: 0}
}

function checkRoyalFlush () {
    var isRoyal = checkRoyal();
    var isFlush = checkFlush();
    var ace_suit;

    if(isRoyal.result && isFlush.result) {

        for(let idx = 14; idx > 9; idx--) {
            var filter = array_cards.filter(e => e.rank == idx)
            if(filter && filter.length == 1)
            ace_suit = filter[0].suit
        }

        var ace = array_cards.filter(e => e.rank == 14).findIndex(el => el.suit == ace_suit)
        var king = array_cards.filter(e => e.rank == 13).findIndex(el => el.suit == ace_suit)
        var queen = array_cards.filter(e => e.rank == 12).findIndex(el => el.suit == ace_suit)
        var jack = array_cards.filter(e => e.rank == 11).findIndex(el => el.suit == ace_suit)
        var ten = array_cards.filter(e => e.rank == 10).findIndex(el => el.suit == ace_suit)

        if(ace >= 0 && king >= 0 && queen >=0 && jack >= 0 && ten >=0 ) {
            return {result: true, data: 60}
        }
        else return {result: false, data: 0}
    } else return {result: false, data: 0}
}

function checkStraight() {
    var arr_straight = [];
    var each_index = [];
    var each_flag = [];
    var result_data = [];

    if(checkRoyal().result) 
    return false;

    array_cards.forEach(e => {
        if( !arr_straight.includes(e.rank) )
        arr_straight.push(e.rank)
    })
    arr_straight.sort((a, b) => a - b)

    for(var i = 0; i < arr_straight.length; i++) {
        if(arr_straight[i+1] == arr_straight[i]+1 && arr_straight[i+2] == arr_straight[i]+2 &&
        arr_straight[i+3] == arr_straight[i]+3 && arr_straight[i+4] == arr_straight[i]+4) {
            each_index[i] = [arr_straight[i], arr_straight[i+1], arr_straight[i+2], arr_straight[i+3], arr_straight[i+4]]
            each_flag[i] = true
        } else {each_index[i] = [0]; each_flag[i] = false}
    }

    if(each_flag.includes(true)) {
        each_index.forEach((e, i) => {
            result_data[i] = e.reduce((p_sum, a) => p_sum + a, 0)
        })
        return {result: true, data: Math.max(...result_data), each: each_index, lowace: false}
    } else if(arr_straight.includes(14) && arr_straight.includes(2) && arr_straight.includes(3) &&
    arr_straight.includes(4) && arr_straight.includes(5) && !arr_straight.includes(6)) {
        return {result: true, data: 15, lowace: true}
    } else return {result: false, data: 0, lowace: false}
}

function checkDuplicate() {
    var array_rank = [];
    var duplicate_cards = [];
    var result = {};
    
    array_cards.forEach(e => {
        array_rank.push(e.rank)
    })

    duplicate_cards = array_rank.filter((item, index) => array_rank.indexOf(item) != index)

    duplicate_cards.forEach(e => {
        var filter = array_rank.filter(el => el == e )
        result[e] = filter.length
    })
    return result;
}

function checkFourKind() {
    var duplicates = checkDuplicate();
    var result_data = 0;

    var highvalue = Object.values(duplicates)
    
    if(highvalue.includes(4)) {
        result_data = Object.keys(duplicates).filter(key=> duplicates[key] == 4).map(e => parseInt(e) )
        return {result: true, data: result_data}
    } else return {result: false, data: result_data}
}

function checkFullHouse() {
    var duplicates = checkDuplicate();
    var three = []
    var two = [];
    
    var fullhouse = Object.values(duplicates)

    if(fullhouse.includes(3) & fullhouse.includes(2)) {
        for(const property in duplicates) {
            if(duplicates[property] == 3) {
                three.push(property)
            }
            if(duplicates[property] == 2) {
                two.push(property)
            }
        }
        return { result: true, data: { 'three': Math.max(...three), 'two': Math.max(...two)}}
    } else if(fullhouse.includes(3)) {
        var threepair = fullhouse.filter(e => e == 3)
        if(threepair.length >= 2) {
            var threekeys = Object.keys(duplicates).filter(key => duplicates[key] == 3).map(e => parseInt(e))
            return {result: true, data: { 'three': Math.max(...threekeys), 'two': Math.min(...threekeys)}}
        } else return { result: false, data: 0}
    } else return { result: false, data: 0}
}

function checkThreeKind() {
    var duplicates = checkDuplicate();
    var result_data = [];

    var threekind = Object.values(duplicates)

    if(threekind.includes(3) && !threekind.includes(2)) {
        for(const propery in duplicates) {
            if(duplicates[propery] == 3)
            result_data.push(parseInt(propery))
        } 
        return {result: true, data: Math.max(...result_data)}
    } else return { result: false, data: 0}
}

function checkTwoPair () {
    var duplicates = checkDuplicate();
    var result_data = 0;

    var twopair = Object.values(duplicates)

    var twopair_len = twopair.filter(e => e == 2)

    if(twopair_len.length >= 2 && !twopair.includes(3)) {
        result_data = Object.keys(duplicates).filter(key => duplicates[key] == 2).map(e => parseInt(e) )
        return { result: true, data: result_data}
    } else return { result: false, data: result_data}
}

function checkOnePair() {
    var duplicates = checkDuplicate();
    var result_data = 0

    var onepair = Object.values(duplicates)

    var onepair_len = onepair.filter(e => e == 2)

    if(onepair_len.length == 1 && !onepair.includes(3)) {
        result_data = Object.keys(duplicates).filter(key => duplicates[key] == 2).map(e => parseInt(e) )
        return { result: true, data: result_data}
    } else return { result: false, data: result_data}
}

function checkStraightFlush() { 
    var isStraight = checkStraight()
    var low_ace = isStraight.lowace
    var str_data = isStraight.each
    var isFlush = checkFlush()
    var str_flsh = []
    var i_loop = []
    var result_data = [];
    var each_res = []
    var check_suit = ''

    if(isStraight && isStraight.result && isFlush && isFlush.result ) {

        str_flsh = array_cards.slice();
        str_flsh.sort((a,b) => a.rank - b.rank)

        if(low_ace) {
            for(var k = 2; k < 6; k++) {
                var filter = str_flsh.filter(e => e.rank == k)
                if(filter && filter.length == 1)
                check_suit = filter[0].suit
            }

            if(check_suit == '')
            check_suit = str_flsh.filter(e => e.rank == 14)[0].suit

            var ace = str_flsh.filter(e => e.rank == 14).findIndex(e => e.suit == check_suit)
            var two = str_flsh.filter(e => e.rank == 2).findIndex(e => e.suit == check_suit)
            var three = str_flsh.filter(e => e.rank == 3).findIndex(e => e.suit == check_suit)
            var four = str_flsh.filter(e => e.rank == 4).findIndex(e => e.suit == check_suit)
            var five = str_flsh.filter(e => e.rank == 5).findIndex(e => e.suit == check_suit)

            if(ace >= 0 && two >=0 && three >=0 && four >= 0 && five >=0 ) {
                return {result: true, data: 15}
            }else return {result: false, data: 0}
            
        } else {

            for(var i = 0; i < str_data.length; i++) {
                each_res[i]= []
                
                str_data[i].forEach((e, j) => {
                    var filter = str_flsh.filter(e => e.rank == str_data[i][j])
                    if(filter && filter.length == 1) 
                    check_suit = filter[0].suit
                })

                for(var j = 0; j < str_data[i].length; j++) {
                    var res = str_flsh.filter(e => e.rank == str_data[i][j] && e.suit == check_suit)
                    if(res.length > 0)
                    each_res[i].push(res)

                    if(each_res[i].length >= 5)
                    i_loop.push(true)

                }

                if(each_res[i].length >=5 && i <= str_data.length - 1) {
                    var finalarr = []
                    each_res[i].forEach(e => { finalarr.push(e[0].rank)})
                    result_data = finalarr
                }
            }
            if(i_loop.includes(true)) {
                return {result: true, data: result_data.reduce((p_sum, a) => p_sum + a, 0)}
            } else return {result: false, data: 0}
        }
    } else return {result: false, data: 0}  
}

function evalHighCard() {
    var ranks = []
    array_cards.forEach(e => {
        if(e.user)
        ranks.push(e.rank)
    })
    return Math.max(...ranks)
}

module.exports.checkRank = function() {
    var isRoyalFlush = checkRoyalFlush()
    if(isRoyalFlush && isRoyalFlush.result)  
    return {
        message: 'Its a Royal Flush with the sum of'+isRoyalFlush.data,
        cards: [],
        sum: isRoyalFlush.data,
        rank: 1,
        cardtotal: card_total,
    }

    var isStraightFlush = checkStraightFlush()
    if(isStraightFlush && isStraightFlush.result) 
    return {
        message: 'Its a Straight Flush with the sum of '+isStraightFlush.data,
        cards: [],
        sum: isStraightFlush.data,
        rank: 2,
        cardtotal: card_total,
    }

    var isFourKind = checkFourKind()
    if(isFourKind.result) 
    return {
        message: 'Its Four of a Kind Card no. '+isFourKind.data,
        cards: [isFourKind.data],
        sum: isFourKind.data * 4,
        rank: 3,
        cardtotal: card_total,
    }

    var isFullHouse = checkFullHouse()
    if(isFullHouse.result) 
    return {
        message: 'Its FullHouse with '+isFullHouse.data.three+' as Three pair Card and '+isFullHouse.data.two+' as two pair card',
        cards: [isFullHouse.data.three, isFullHouse.data.two],
        sum: isFullHouse.data.three + isFullHouse.data.two,
        rank: 4,
        cardtotal: card_total,
    }

    var isFlush = checkFlush()
    if(isFlush && isFlush.result) 
    return {
        message: 'Its Flush '+isFlush.data,
        cards: [],
        sum: isFlush.data,
        rank: 5,
        cardtotal: card_total,
    }

    var isStraight = checkStraight()
    if(isStraight && isStraight.result ) 
    return {
        message: 'Its a Straight with the sum of'+isStraight.data,
        cards: [],
        sum: isStraight.data,
        rank: 6,
        cardtotal: card_total,
    }

    var isThreeKind = checkThreeKind()
    if(isThreeKind.result) 
        return {
            message: 'Its Three of a kind Card no. '+isThreeKind.data,
            cards: [isThreeKind.data],
            sum: isThreeKind.data * 3,
            rank: 7,
            cardtotal: card_total,
        }

    var isTwoPair = checkTwoPair()
    if(isTwoPair.result) 
    return {
        message: 'Its Two Pair Card no.'+isTwoPair.data, 
        cards: isTwoPair.data,
        sum: isTwoPair.data.reduce((total, currentval ) => total + currentval*2 , 0),
        rank: 8,
        cardtotal: card_total,
    }
    
    var isOnePair = checkOnePair()
    if(isOnePair.result) 
        return {
            message: 'Its One Pair Card no. '+isOnePair.data,
            cards: isOnePair.data,
            sum: isOnePair.data * 2,
            rank: 9,
            cardtotal: card_total,
        }

    var highCard = evalHighCard()
    return {
        message: 'High Card '+highCard,
        cards: highCard,
        sum: highCard,
        rank: 10,
        cardtotal: card_total,
    }
}
