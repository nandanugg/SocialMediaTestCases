import { check } from "k6";
import { generateTestObjects, isExists, testGet, testPostJson, isValidDate } from "../helper.js";

const TEST_NAME = "(friends test)"

const friendParamTestObjects = generateTestObjects({
    limit: { type: "number", min: 0 },
    offset: { type: "number", min: 0 },
    sortBy: { type: "string-param", enum: ["friendCount", "createdAt"] },
    orderBy: { type: "string-param", enum: ["asc", "desc"] },
    onlyFriend: { type: "boolean" },
}, {
    limit: 10,
    offset: 0,
    sortBy: "friendCount",
    orderBy: "asc",
    onlyFriend: false,
})
const friendAddTestObjects = generateTestObjects({
    userId: { type: "string" },
}, {
    userId: "asdasd"
})



export function TestFriends(user, doNegativeCase) {
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/friend"

    let usrWithFriends = TestGetFriends(route, user, doNegativeCase)
    usrWithFriends = TestAddFriends(route, usrWithFriends, doNegativeCase)

    return usrWithFriends
}

function TestGetFriends(route, user, doNegativeCase) {
    let res;
    const currentFeature = TEST_NAME + "get friend"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    if (doNegativeCase) {
        // Negative case, no auth
        res = testGet(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid param
        friendParamTestObjects.forEach(payload => {
            res = testGet(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong param should return 400 | ' + res.url]: (r) => r.status === 400,
            })
        })
    }

    let friendsKv = {}

    // Positive case, search paramless
    res = testGet(route, {
    }, headers)
    check(res, {
        [currentFeature + " search paramless should return 200"]: (r) => r.status === 200,
        [currentFeature + " search paramless should have more than one data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length > 0
        },
    })

    // Postiive case, pagination and createdAt default sorting
    res = testGet(route, {
        limit: 10,
        offset: 0
    }, headers)
    check(res, {
        [currentFeature + " search with pagination should return 200"]: (r) => r.status === 200,
        [currentFeature + " search with pagination should have only ten data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 10
        },
        [currentFeature + " search with pagination should have correct createdAt format and ordered desc"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                if (i == 0) return true
                if (v.createdAt === undefined) return false
                if (!isValidDate(v.createdAt)) return false

                const curDate = new Date(v.createdAt)
                const prevDate = new Date(parsedRes[i - 1].createdAt)

                friendsKv[v.userId] = v
                return prevDate.getTime() >= curDate.getTime()
            })
        },
    })


    // Postiive case, pagination and createdAt asc sorting
    res = testGet(route, {
        limit: 3,
        offset: 0,
        orderBy: "asc"
    }, headers)
    check(res, {
        [currentFeature + " search with pagination and orderBy asc should return 200"]: (r) => r.status === 200,
        // TODO: insert a lot of user first before testing
        [currentFeature + " search with pagination and orderBy asc should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " search with pagination and orderBy asc should have correct createdAt format and ordered asc"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                if (i == 0) return true
                if (v.createdAt === undefined) return false
                if (!isValidDate(v.createdAt)) return false

                const curDate = new Date(v.createdAt)
                const prevDate = new Date(parsedRes[i - 1].createdAt)

                friendsKv[v.userId] = v
                return prevDate.getTime() <= curDate.getTime()
            })

        },
    })

    // Postiive case, pagination and friendCount asc sorting
    res = testGet(route, {
        limit: 3,
        offset: 0,
        orderBy: "asc",
        sortBy: "friendCount"
    }, headers)
    check(res, {
        [currentFeature + " search with pagination orderBy asc, and sortBy friendCount should return 200"]: (r) => r.status === 200,
        [currentFeature + " search with pagination orderBy asc, and sortBy friendCount should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " search with pagination orderBy asc, and sortBy friendCount should have correct friendCount format and ordered asc"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                if (i == 0) return true
                if (v.friendCount === undefined) return false

                friendsKv[v.userId] = v
                return parsedRes[i - 1].friendCount <= v.friendCount
            })

        },
    })

    // Postiive case, pagination and search results
    res = testGet(route, {
        limit: 3,
        offset: 0,
        search: "s"
    }, headers)
    check(res, {
        [currentFeature + " search with pagination and keyword query should return 200"]: (r) => r.status === 200,
        // TODO: insert a lot of user first before testing
        [currentFeature + " search with pagination and keyword query should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " search with pagination and keyword query should have data that contains 's'"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v) => {
                friendsKv[v.userId] = v
                if (v.name === undefined) return false

                return v.name.includes("s") || v.name.includes("S")
            })

        },
    })


    return {
        accessToken: user.accessToken,
        phone: user.phone,
        email: user.email,
        name: user.name,
        password: user.password,
        imageUrls: user.imageUrls,
        friendsKv: friendsKv
    }
}

function TestAddFriends(route, user, doNegativeCase) {
    let res;
    const currentFeature = TEST_NAME + "add friend"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid body 
        friendAddTestObjects.forEach(payload => {
            res = testPostJson(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })

        // Negative case, not found user
        res = testPostJson(route, {
            userId: "asdadadsas"
        }, headers)
        check(res, {
            [currentFeature + ' wrong body random userId should return 404 ']: (r) => r.status === 404,
        })
    }


    // Positive case, add friend
    Object.values(user.friendsKv).forEach((friend) => {
        res = testPostJson(route, {
            userId: friend.userId
        }, headers)
        check(res, {
            [currentFeature + ' with correct userId should return 200 ']: (r) => r.status === 200,
        })
        user.friendsKv[friend.userId].added = true
    });

    // Positive case, get all friends that already added
    res = testGet(route, {
        limit: 1000,
        offset: 0,
        onlyFriend: true
    }, headers)
    check(res, {
        [currentFeature + " get friends after adding friend should return 200"]: (r) => r.status === 200,
        [currentFeature + " get friends after adding friend should have the correct friends"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v) => {
                return user.friendsKv[v.userId] !== undefined && user.friendsKv[v.userId].added === true
            })
        },
    })

    return {
        accessToken: user.accessToken,
        phone: user.phone,
        email: user.email,
        name: user.name,
        password: user.password,
        imageUrls: user.imageUrls,
        friendsKv: user.friendsKv
    }
}