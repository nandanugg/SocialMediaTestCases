import { check } from "k6";
import { generateRandomEmail, generateTestObjects, generateRandomImageUrl, generateRandomPassword, generateRandomPhoneNumber, generateUniqueName, isExists, testGet, isEqual, testPatchJson, testPostJson } from "../helper.js";

const TEST_NAME = "(friends test)"

const friendTestObjects = generateTestObjects({
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



export function TestFriends(user, doNegativeCase) {
    let route = __ENV.BASE_URL + "/v1/friend"
    const currentFeature = TEST_NAME

    const headers = { "Authorization": "Bearer " + user.accessToken }

    if (doNegativeCase) {
        // Negative case, no auth
        res = testGet(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, invalid payload
        friendTestObjects.forEach(payload => {
            res = testGet(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong value should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    // Postiive case, get by query
    res = testGet(route, {
        search: "s"
    }, headers)
    check(res, {
        [currentFeature + " correct value should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct value should have more than one data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length > 0
        },
    })
    // Postiive case, pagination
    res = testGet(route, {
        limit: 10,
        offset: 0
    }, headers)
    check(res, {
        [currentFeature + " correct value should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct value should have only ten data"]: (r) => {
            const parsedRes = isExists(r, "data")
            return Array.isArray(parsedRes) && parsedRes.length == 10
        },

    })


    // Positive case, login should give newly created data
    res = testGet(route, {
        credentialType: "email",
        credentialValue: user.email,
        password: user.password
    })
    isSuccess = check(res, {
        [currentFeature + " correct value should return 200"]: (r) => r.status === 200,
        [currentFeature + " correct value should have phone property"]: (r) => isEqual(r, "data.phone", user.phone),
        [currentFeature + " correct value should have email property"]: (r) => isEqual(r, "data.email", user.email),
        [currentFeature + " correct value should have name property"]: (r) => isEqual(r, "data.name", payload.name),
        [currentFeature + " correct value should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })


    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: user.phone,
        email: user.email,
        name: payload.name,
        password: user.password,
        imageUrl: payload.imageUrl
    } : null
}
