import { check, sleep } from 'k6';
import { generateTestObjects, generateUniqueName, generateRandomPassword, isEqual, isExists, testPostJson, generateRandomPhoneNumber, generateRandomEmail } from "../helper.js";

const registerPhoneTestObjects = generateTestObjects({
    credentialType: { type: "string", enum: ["phone"], notNull: true },
    credentialValue: { type: "string", minLength: 7, maxLength: 13, notNull: true, isPhoneNumber: true, addPlusPrefixPhoneNumber: true },
    name: { type: "string", minLength: 5, maxLength: 50, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    credentialType: "phone",
    credentialValue: generateRandomPhoneNumber(true),
    name: generateUniqueName(),
    password: generateRandomPassword()
})

const registerEmailTestObjects = generateTestObjects({
    credentialType: { type: "string", enum: ["email"], notNull: true },
    credentialValue: { type: "string", notNull: true, isEmail: true },
    name: { type: "string", minLength: 5, maxLength: 50, notNull: true },
    password: { type: "string", minLength: 5, maxLength: 15, notNull: true }
}, {
    credentialType: "email",
    credentialValue: generateRandomEmail(),
    name: generateUniqueName(),
    password: generateRandomPassword()
})


const TEST_NAME = "(register test)"

export function RegistrationTest(doNegativeCase) {
    let res;
    // eslint-disable-next-line no-undef
    let route = __ENV.BASE_URL + "/v1/user/register"
    if (doNegativeCase) {
        res = testPostJson(route, {}, {}, ["noContentType"])
        check(res, {
            [TEST_NAME + "post register no body should return 400"]: (r) => r.status === 400
        })
    }

    const usrByPhone = PhoneRegistrationTest(route, doNegativeCase)
    const usrByEmail = EmailRegistrationTests(route, doNegativeCase)

    sleep(3)
    return [usrByPhone, usrByEmail]
}


function PhoneRegistrationTest(route, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post register phone"
    const positivePayload = {
        credentialType: "phone",
        credentialValue: generateRandomPhoneNumber(true),
        name: generateUniqueName(),
        password: generateRandomPassword()
    }

    if (doNegativeCase) {
        // Negative case, invalid body
        registerPhoneTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    res = testPostJson(route, positivePayload)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 201 | " + JSON.stringify(positivePayload)]: (r) => r.status === 201,
        [currentFeature + " correct body should have phone property"]: (r) => isEqual(r, "data.phone", positivePayload.credentialValue),
        [currentFeature + " correct body should have name property"]: (r) => isEqual(r, "data.name", positivePayload.name),
        [currentFeature + " correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })
    if (!isSuccess) {
        console.log("register failed", res.status, res.body)
    }

    if (doNegativeCase && isSuccess) {
        const failedRes = testPostJson(route, positivePayload)
        isSuccess = check(failedRes, {
            [currentFeature + " duplicate user should return 409"]: (r) => r.status === 409
        })
    }

    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: positivePayload.credentialValue,
        name: positivePayload.name,
        password: positivePayload.password
    } : null
}
function EmailRegistrationTests(route, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post register email"
    const positivePayload = {
        credentialType: "email",
        credentialValue: generateRandomEmail(),
        name: generateUniqueName(),
        password: generateRandomPassword()
    }

    if (doNegativeCase) {
        // Negative case, invalid body
        registerEmailTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong body should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
    }

    res = testPostJson(route, positivePayload)
    let isSuccess = check(res, {
        [currentFeature + " correct body should return 201 | " + JSON.stringify(positivePayload)]: (r) => r.status === 201,
        [currentFeature + " correct body should have email property"]: (r) => isEqual(r, "data.email", positivePayload.credentialValue),
        [currentFeature + " correct body should have name property"]: (r) => isEqual(r, "data.name", positivePayload.name),
        [currentFeature + " correct body should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })
    if (!isSuccess) {
        console.log("register failed", res.status, res.body)
    }

    if (doNegativeCase && isSuccess) {
        const failedRes = testPostJson(route, positivePayload)
        isSuccess = check(failedRes, {
            [currentFeature + " duplicate user should return 409"]: (r) => r.status === 409
        })
    }

    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        email: positivePayload.credentialValue,
        name: positivePayload.name,
        password: positivePayload.password
    } : null
}