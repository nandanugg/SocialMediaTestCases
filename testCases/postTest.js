import { check, randomSeed } from "k6";
import { generateTestObjects, generateUniqueName, isExists, testGet, testPostJson, isValidDate } from "../helper.js";

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

export function TestPost(user, doNegativeCase, tags = {}) {
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/post"

    let usrWithFriends = TestAddPost(route, user, doNegativeCase, tags)
    usrWithFriends = TestGetPost(route, usrWithFriends, doNegativeCase,)

    return usrWithFriends
}

function TestAddPost(route, user, doNegativeCase, tags = {}) {
    let res;
    const postKv = Object.assign({}, user.userPostKv)
    const currentFeature = TEST_NAME + "add post"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    const positivePayload = {
        postInHtml: "stress sekali berada di project sprint gaes " + generateUniqueName(),
        tags: [
            tagsDictionary[0],
            tagsDictionary[Math.floor(Math.random() * tagsDictionary.length)],
            tagsDictionary[Math.floor(Math.random() * tagsDictionary.length)],
            tagsDictionary[Math.floor(Math.random() * tagsDictionary.length)],
        ]
    }

    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {}, tags)
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid body
        postTestObjects.forEach(payload => {
            res = testPostJson(route, payload, headers, tags)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    for (let i = 0; i < 3; i++) {
        // Positive case, add post
        res = testPostJson(route, i > 1 ? positivePayload : {
            postInHtml: "stress sekali berada di project sprint gaes " + generateUniqueName(),
            tags: [
                tagsDictionary[0],
                tagsDictionary[Math.floor(Math.random() * tagsDictionary.length)],
                tagsDictionary[Math.floor(Math.random() * tagsDictionary.length)],
                tagsDictionary[Math.floor(Math.random() * tagsDictionary.length)],
            ]
        }, headers, tags)
        check(res, {
            [currentFeature + " correct body should return 200"]: (r) => r.status === 200
            ,
        })
    }

    // Positive case, get post that already added
    res = testGet(route, {
        limit: 10,
        offset: 0,
        search: positivePayload.postInHtml
    }, headers, tags)
    check(res, {
        [currentFeature + " get post after posting should return 200"]: (r) => r.status === 200,
        [currentFeature + " get post after posting should have the post that already added"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!(Array.isArray(parsedRes))) return false

            let found = false;
            parsedRes.forEach((v) => {
                if (v.postId === undefined) return false
                if (v.post.postInHtml && v.post.postInHtml === positivePayload.postInHtml) {
                    postKv[v.postId] = v.post
                    found = true
                }
            })
            return found
        },
    })

    return {
        accessToken: user.accessToken,
        phone: user.phone,
        email: user.email,
        name: user.name,
        password: user.password,
        imageUrls: user.imageUrls,
        userPostKv: postKv
    }
}

function TestGetPost(route, user, doNegativeCase, tags = {}) {
    let res;
    const currentFeature = TEST_NAME + "get post"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    const postKv = {}
    if (doNegativeCase) {
        // Negative case, no auth
        res = testGet(route, {}, {}, tags)
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid param
        addPostTestObjects.forEach(payload => {
            res = testGet(route, payload, headers, tags)
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
    }, headers, tags)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + "text search correct param should be ordered by post created at"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                if (i == 0) return true
                if (v.post === undefined) return false
                if (v.postId === undefined) return false
                if (v.post.createdAt === undefined) return false
                if (!isValidDate(v.post.createdAt)) return false

                const curDate = new Date(v.post.createdAt)
                const prevDate = new Date(parsedRes[i - 1].post.createdAt)

                postKv[v.postId] = v
                return prevDate.getTime() >= curDate.getTime()
            })
        },
        [currentFeature + " correct param should have data that contains s"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v) => {
                if (v.post === undefined) return false
                if (v.post.postInHtml === undefined) return false

                return v.post.postInHtml.includes("s") || v.post.postInHtml.includes("S")
            })

        },
    })

    // Postiive case, pagination and tag search result
    res = testGet(route, {
        limit: 3,
        offset: 0,
        searchTag: tagsDictionary[0]
    }, headers, tags)
    check(res, {
        [currentFeature + " correct param should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param should have only three data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 3
        },
        [currentFeature + "tag search correct param should be ordered by post created at"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v, i) => {
                if (i == 0) return true
                if (v.post === undefined) return false
                if (v.postId === undefined) return false
                if (v.post.createdAt === undefined) return false
                if (!isValidDate(v.post.createdAt)) return false

                const curDate = new Date(v.post.createdAt)
                const prevDate = new Date(parsedRes[i - 1].post.createdAt)

                postKv[v.postId] = v
                return prevDate.getTime() >= curDate.getTime()
            })
        },
        [currentFeature + " correct param should have " + tagsDictionary[0] + " tags"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!Array.isArray(parsedRes)) return false

            return parsedRes.every((v) => {
                if (v.post === undefined) return false
                if (v.postId === undefined) return false
                if (v.post.tags === undefined) return false

                postKv[v.postId] = v
                return v.post.tags.includes(tagsDictionary[0])
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
        allPostKv: postKv,
        userPostKv: user.userPostKv
    }
}

