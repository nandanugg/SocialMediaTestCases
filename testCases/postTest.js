import { check, randomSeed } from "k6";
import { generateRandomEmail, generateTestObjects, generateRandomImageUrl, generateRandomPassword, generateRandomPhoneNumber, generateUniqueName, isExists, testGet, isEqual, testPatchJson, testPostJson, isValidDate } from "../helper.js";

const TEST_NAME = "(post test)"
const tagsDictionary = ["mantul", "sedap", "asik", "oke", 'gas', 'makansianggratis']
const postTestObjects = generateTestObjects({
    postInHtml: { type: "string", minLength: 2, maxLength: 500 },
    tags: { type: "array", items: { items: { type: "string" }, notNull: true } },
}, {
    postInHtml: "stress sekali berada di project sprint gaes",
    tags: [
        tagsDictionary[randomSeed(tagsDictionary.length - 1)]
    ]
})

const addPostTestObjects = generateTestObjects({
    limit: { type: "number", min: 0 },
    offset: { type: "number", min: 0 },
}, {
    limit: 10,
    offset: 0,
})

export function TestPost(user, doNegativeCase) {
    let route = __ENV.BASE_URL + "/v1/post"

    let usrWithFriends = TestGetFriends(route, user, doNegativeCase)
    usrWithFriends = TestAddFriends(route, user, doNegativeCase)

    return usrWithFriends
}

function TestAddPost(route, user, doNegativeCase) {
    let res;
    const currentFeature = TEST_NAME + "add post"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    const positivePayload = {
        postInHtml: "stress sekali berada di project sprint gaes",
        tags: [
            tagsDictionary[0],
            tagsDictionary[randomSeed(tagsDictionary.length - 1)],
            tagsDictionary[randomSeed(tagsDictionary.length - 1)],
            tagsDictionary[randomSeed(tagsDictionary.length - 1)],
        ]
    }

    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid param
        postTestObjects.forEach(payload => {
            res = testPostJson(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong param should return 400 | ' + res.url]: (r) => r.status === 400,
            })
        })
    }

    // Positive case, add post
    res = testPostJson(route, positivePayload, headers)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
    })

    return {
        accessToken: res.json().data.accessToken,
        phone: user.phone,
        email: user.email,
        name: user.name,
        password: user.password,
        imageUrls: user.imageUrls,
        postKv: postKv
    }
}

function TestGetPost(route, user, doNegativeCase) {
    let res;
    const currentFeature = TEST_NAME + "get post"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    let postKv = {}

    if (doNegativeCase) {
        // Negative case, no auth
        res = testGet(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid param
        addPostTestObjects.forEach(payload => {
            res = testGet(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong param should return 400 | ' + res.url]: (r) => r.status === 400,
            })
        })
    }

    // Postiive case, pagination and search results
    res = testGet(route, {
        limit: 3,
        offset: 0,
        search: "s"
    }, headers)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " correct param should be ordered by post created at"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (v.post === undefined) return false

            return parsedRes.every((v, i) => {
                postKv[v.postId] = v
                if (v.createdAt === undefined) return false
                if (!isValidDate(v.createdAt)) return false

                const curDate = new Date(v.createdAt)
                const prevDate = new Date(parsedRes[i - 1].createdAt)

                return prevDate.getTime() <= curDate.getTime()
            })
        },
        [currentFeature + " correct param should have data that contains s"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                postKv[v.postId] = v
                if (v.name === undefined) return false

                return v.name.includes("s") || v.name.includes("S")
            })

        },
    })

    // Postiive case, pagination and tag search result
    res = testGet(route, {
        limit: 3,
        offset: 0,
        searchTag: tagsDictionary[0]
    }, headers)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + " correct param should have " + tagsDictionary[0] + " tags"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                postKv[v.postId] = v
                if (v.post === undefined) return false
                if (v.post.tags === undefined) return false

                return v.post.tags.includes(tagsDictionary[0])
            })

        },
    })

    // Positive case, add post
    res = testGet(route, positivePayload, headers)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
    })

    return {
        accessToken: res.json().data.accessToken,
        phone: user.phone,
        email: user.email,
        name: user.name,
        password: user.password,
        imageUrls: user.imageUrls,
        postKv: postKv
    }
}