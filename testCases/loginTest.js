import { check } from "k6";
import { generateRandomEmail, generateRandomPassword, generateRandomPhoneNumber, testPostJson, generateTestObjects, isEqual, isExists } from "../helper.js";

const TEST_NAME = "(login test)"

const registerPhoneTestObjects = generateTestObjects({
    credentialType: { type: "string", enum: ["phone"], notNull: true },
    credentialValue: { type: "string", minLength: 7, maxLength: 13, notNull: true, isPhoneNumber: true, addPlusPrefixPhoneNumber: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    credentialType: "phone",
    credentialValue: generateRandomPhoneNumber(true),
    password: generateRandomPassword()
})

const registerEmailTestObjects = generateTestObjects({
    credentialType: { type: "string", enum: ["email"], notNull: true },
    credentialValue: { type: "string", notNull: true, isEmail: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    credentialType: "email",
    credentialValue: generateRandomEmail(),
    password: generateRandomPassword()
})


export function LoginTest(userByPhone, userByEmail, doNegativeCase) {
    let res;
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/user/login"
    if (doNegativeCase) {
        res = testPostJson(route, {}, {}, ["noContentType"])
        check(res, {
            [TEST_NAME + "post login no body should return 400|"]: (r) => r.status === 400
        })
    }
    const usrByPhone = PhoneLoginTest(route, userByPhone, doNegativeCase)
    const usrByEmail = EmailLoginTest(route, userByEmail, doNegativeCase)
    return [usrByPhone, usrByEmail]
}

function PhoneLoginTest(route, user, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post login phone"
    const positivePayload = {
        credentialType: "phone",
        credentialValue: user.phone,
        password: user.password
    }
    if (doNegativeCase) {
        // Negative case, invalid body
        registerPhoneTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
        // Negative case, login using not exists user
        res = testPostJson(route, {
            credentialType: "phone",
            credentialValue: generateRandomPhoneNumber(true),
            password: generateRandomPassword()
        })
        check(res, {
            [currentFeature + " non exist user should return 404"]: (r) => r.status === 404
        })
    }

    // Positive case, login
    res = testPostJson(route, positivePayload)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 200 | " + JSON.stringify(positivePayload)]: (r) => r.status === 200,
        [currentFeature + " correct body should have phone property"]: (r) => isEqual(r, "data.phone", user.phone),
        [currentFeature + " correct body should have name property"]: (r) => isEqual(r, "data.name", user.name),
        [currentFeature + " correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })
    if (!isSuccess) {
        console.log("login failed", res.status, res.body)
    }


    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: positivePayload.credentialValue,
        email: "",
        name: user.name,
        password: user.password
    } : null


}
function EmailLoginTest(route, user, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post login email"
    const positivePayload = {
        credentialType: "email",
        credentialValue: user.email,
        password: user.password
    }
    if (doNegativeCase) {
        // Negative case, invalid body
        registerEmailTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
        // Negative case, login using not existing user
        res = testPostJson(route, {
            credentialType: "email",
            credentialValue: generateRandomEmail(),
            password: generateRandomPassword()
        })
        check(res, {
            [currentFeature + " non exist user should return 404"]: (r) => r.status === 404
        })
    }
    // Positive case, login
    res = testPostJson(route, positivePayload)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 200 | " + JSON.stringify(positivePayload)]: (r) => r.status === 200,
        [currentFeature + " correct body should have email property"]: (r) => isEqual(r, "data.email", user.email),
        [currentFeature + " correct body should have name property"]: (r) => isEqual(r, "data.name", user.name),
        [currentFeature + " correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })
    if (!isSuccess) {
        console.log("login failed", res.status, res.body)
    }


    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: "",
        email: positivePayload.credentialValue,
        name: user.name,
        password: user.password
    } : null

}