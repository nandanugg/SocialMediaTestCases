import { check } from "k6";
import { generateTestObjects, generateUniqueName, isExists, testGet, testPostJson } from "../helper.js";

const TEST_NAME = "(post comment test)"


const postCommentTestObjects = generateTestObjects({
    postId: { type: "string" },
    comment: { type: "string", minLength: 2, maxLength: 500 },
}, {
    postId: "asdasd",
    comment: "asdasd"
})

export function TestPostComment(user, doNegativeCase, tags = {}) {
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/post/comment"

    const postIds = Object.keys(user.allPostKv)

    let usrWithFriends = TestCommentPost(route, postIds, user, doNegativeCase, tags)
    return usrWithFriends
}

function TestCommentPost(route, validPostIds, user, doNegativeCase, tags = {}) {
    let res;
    const currentFeature = TEST_NAME + "add post comment"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    // eslint-disable-next-line no-undef
    let postRoute = __ENV.BASE_URL + "/v1/post"
    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {}, tags)
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid body
        postCommentTestObjects.forEach(payload => {
            res = testPostJson(route, payload, headers, tags)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        });

        // Negative case, invalid postId
        res = testPostJson(route, {
            postId: "asdasd",
            comment: "asdasd"
        }, headers, tags)
        check(res, {
            [currentFeature + " wrong postId should return 404"]: (r) => r.status === 404
        })
    }

    // Positive case, add comment
    const comment = generateUniqueName()
    res = testPostJson(route, {
        postId: validPostIds[0],
        comment
    }, headers, tags)
    check(res, {
        [currentFeature + " correct postId should return 200"]: (r) => r.status === 200
    })
    const searchQuery = user.allPostKv[validPostIds[0]].post.postInHtml
    // Positive case, check is comment already added
    res = testGet(postRoute, {
        limit: 10,
        offset: 0,
        search: searchQuery
    }, headers, tags)
    check(res, {
        [currentFeature + " get post after adding comment should return 200"]: (r) => r.status === 200,
        [currentFeature + " get post after adding comment should have the post that already commented"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!(Array.isArray(parsedRes))) return false

            let found = false;
            parsedRes.forEach((v) => {
                if (v.comments && Array.isArray(v.comments) && v.comments.includes(comment)) {
                    found = true
                }
            })
            return found
        },
    })

    return user
}