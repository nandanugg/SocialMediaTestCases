import { check } from "k6";
import { generateRandomEmail, generateTestObjects, generateRandomImageUrl, isEqual, generateRandomPassword, generateRandomPhoneNumber, generateUniqueName, testPatchJson, testPostJson, isExists } from "../helper.js";

const TEST_NAME = "(update account test)"

const updateAccountTestObjects = generateTestObjects({
    imageUrl: { type: "string", isUrl: true, notNull: true },
    name: { type: "string", minLength: 7, maxLength: 50, notNull: true },
}, {
    imageUrl: "http://image.com/image.png",
    name: "shubaba"
})

export function TestUpdateAccount(user, doNegativeCase) {
    let res
    let route = __ENV.BASE_URL + "/v1/user"
    const currentFeature = TEST_NAME

    const headers = { "Authorization": "Bearer " + user.accessToken }
    const payload = {
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

        // Negative case, invalid payload
        updateAccountTestObjects.forEach(payload => {
            res = testPatchJson(route, payload, headers)
            check(res, {
                [currentFeature + ' wrong value should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    // Postiive case, updating phone
    res = testPatchJson(route, payload, headers)
    let isSuccess = check(res, {
        [currentFeature + " correct value should return 200"]: (r) => r.status === 200,
    })

    // Positive case, login should give newly created data
    res = testPatchJson(route, {
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
