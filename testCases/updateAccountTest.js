import { check } from "k6";
import { generateTestObjects, generateRandomImageUrl, isEqual, generateUniqueName, testPatchJson, testPostJson, isExists } from "../helper.js";

const TEST_NAME = "(update account test)"

const updateAccountTestObjects = generateTestObjects({
    imageUrl: { type: "string", isUrl: true, notNull: true },
    name: { type: "string", minLength: 5, maxLength: 50, notNull: true },
}, {
    imageUrl: "http://image.com/image.png",
    name: "shubaba"
})

export function TestUpdateAccount(user, doNegativeCase) {
    let res
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/user"
    // eslint-disable-next-line no-undef
    let loginRoute = __ENV.BASE_URL + "/v1/user/login"
    const currentFeature = TEST_NAME

    const headers = { "Authorization": "Bearer " + user.accessToken }
    const positivePayload = {
        imageUrl: generateRandomImageUrl(),
        name: generateUniqueName()
    }

    if (doNegativeCase) {
        // Negative case, no auth
        res = testPatchJson(route, {}, {})
        check(res, {
            [currentFeature + " no auth should return 401"]: (r) => r.status === 401
        })

        // Negative case, no body
        res = testPatchJson(route, {}, headers, ["noContentType"])
        check(res, {
            [currentFeature + " no body should return 400"]: (r) => r.status === 400
        })

        // Negative case, invalid body
        updateAccountTestObjects.forEach(payload => {
            res = testPatchJson(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    // Postiive case, updating phone
    res = testPatchJson(route, positivePayload, headers)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 200"]: (r) => r.status === 200,
    })

    // Positive case, login should give newly created data
    res = testPostJson(loginRoute, {
        credentialType: "email",
        credentialValue: user.email,
        password: user.password
    })
    isSuccess = check(res, {
        [currentFeature + " login with correct body should return 200"]: (r) => r.status === 200,
        [currentFeature + " login with correct body should have phone property"]: (r) => isEqual(r, "data.phone", user.phone),
        [currentFeature + " login with correct body should have email property"]: (r) => isEqual(r, "data.email", user.email),
        [currentFeature + " login with correct body should have name property"]: (r) => isEqual(r, "data.name", positivePayload.name),
        [currentFeature + " login with correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })


    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: user.phone,
        email: user.email,
        name: positivePayload.name,
        password: user.password,
        imageUrl: positivePayload.imageUrl
    } : null
}
