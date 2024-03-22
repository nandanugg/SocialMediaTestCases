import { check } from "k6";
import { generateRandomEmail, generateTestObjects, generateRandomImageUrl, generateRandomPassword, generateRandomPhoneNumber, generateUniqueName, isExists, testGet, isEqual, testPatchJson, testPostJson, isValidDate } from "../helper.js";

const TEST_NAME = "(friends test)"

const friendParamTestObjects = generateTestObjects({
    limit: { type: "number", min: 0 },
    offset: { type: "number", min: 0 },
    sortBy: { type: "string", enum: ["friendCount", "createdAt"] },
    orderBy: { type: "string", enum: ["asc", "desc"] },
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
    let route = __ENV.BASE_URL + "/v1/friend"

    let usrWithFriends = TestGetFriends(route, user, doNegativeCase)
    usrWithFriends = TestAddFriends(route, user, doNegativeCase)

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
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have more than one data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length > 0
        },
    })
    console.log(res.headers, res.url);

    // Postiive case, pagination and createdAt default sorting
    res = testGet(route, {
        limit: 10,
        offset: 0
    }, headers)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only ten data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 10
        },
        [currentFeature + " correct param should have correct createdAt format and sorted desc"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                friendsKv[v.userId] = v
                if (i == 0) return true
                if (!isValidDate(v.createdAt)) return false

                curDate = new Date(v.createdAt)
                prevDate = new Date(parsedRes[i - 1].createdAt)

                return prevDate.getTime() > curDate.getTime()
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
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only ten data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " correct param should have correct createdAt format and sorted asc"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                friendsKv[v.userId] = v
                if (i == 0) return true
                if (v.createdAt === undefined) return false
                if (!isValidDate(v.createdAt)) return false

                curDate = new Date(v.createdAt)
                prevDate = new Date(parsedRes[i - 1].createdAt)

                return prevDate.getTime() < curDate.getTime()
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
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only ten data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " correct param should have correct friendCount format and sorted asc"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                friendsKv[v.userId] = v
                if (i == 0) return true
                if (v.friendCount === undefined) return false

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
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only ten data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " correct param should have s"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                friendsKv[v.userId] = v
                if (v.name === undefined) return false

                return v.name.includes("s") || v.name.includes("S")
            })

        },
    })


    return {
        accessToken: res.json().data.accessToken,
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

        // Negative case, invalid param
        friendAddTestObjects.forEach(payload => {
            res = testGet(route, payload, headers)
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
    Object.values(user.friendsKv).forEach((friend, i) => {
        res = testPostJson(route, {
            userId: friend.userId
        }, headers)
        check(res, {
            [currentFeature + 'correct body with correct userId should return 200 ']: (r) => r.status === 200,
        })
        user.friendsKv[i.userId].added = true
    });

    // Positive case, get all friends that already added
    res = testGet(route, {
        limit: 1000,
        offset: 0,
        onlyFriend: true
    }, headers)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have the correct friends"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                return user.friendsKv[v.userId] !== undefined && user.friendsKv[v.userId].added === true
            })
        },
    })

    return {
        accessToken: res.json().data.accessToken,
        phone: user.phone,
        email: user.email,
        name: user.name,
        password: user.password,
        imageUrls: user.imageUrls,
        friendsKv: user.friendsKv
    }
}