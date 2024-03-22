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

export function TestPostComment(user, doNegativeCase) {
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/post/comment"

    console.log(JSON.stringify(user))
    const postIds = Object.keys(user.allPostKv)

    let usrWithFriends = TestCommentPost(route, postIds, user, doNegativeCase)
    return usrWithFriends
}

function TestCommentPost(route, validPostIds, user, doNegativeCase) {
    let res;
    const currentFeature = TEST_NAME + "add post comment"
    const headers = { "Authorization": "Bearer " + user.accessToken }
    // eslint-disable-next-line no-undef
    let postRoute = __ENV.BASE_URL + "/v1/post"
    if (doNegativeCase) {
        // Negative case, no auth
        res = testPostJson(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid body
        postCommentTestObjects.forEach(payload => {
            res = testPostJson(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        });

        // Negative case, invalid postId
        res = testPostJson(route, {
            postId: "asdasd",
            comment: "asdasd"
        }, headers)
        check(res, {
            [currentFeature + " wrong postId should return 404"]: (r) => r.status === 404
        })
    }

    // Positive case, add comment
    const comment = generateUniqueName()
    res = testPostJson(route, {
        postId: validPostIds[0],
        comment
    }, headers)
    check(res, {
        [currentFeature + " correct postId should return 200"]: (r) => r.status === 200
    })
    const searchQuery = user.allPostKv[validPostIds[0]].post.postInHtml
    // Positive case, check is comment already added
    res = testGet(postRoute, {
        limit: 10,
        offset: 0,
        search: searchQuery
    }, headers)
    check(res, {
        [currentFeature + " correct param check added comment should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct param check added comment should have the post that already commented"]: (r) => {
            const parsedRes = isExists(r, "data")
            if (!(Array.isArray(parsedRes))) return false

            let found = parsedRes.some(post => {
                if(post && Array.isArray(post.comments)) {
                    return !!post.comments.some(({ comment: currentComment }) => {
                        return !!currentComment.includes(comment)
                       
                    })
                };
            })
            return found
        },
    })

    return user
}
