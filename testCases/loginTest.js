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
    const usr = {
        credentialType: "phone",
        credentialValue: user.phone,
        password: user.password
    }
    if (doNegativeCase) {
        registerPhoneTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong value should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
        res = testPostJson(route, {
            credentialType: "phone",
            credentialValue: generateRandomPhoneNumber(true),
            password: generateRandomPassword()
        })
        check(res, {
            [currentFeature + " non exist user should return 404"]: (r) => r.status === 404
        })
    }

    res = testPostJson(route, usr)
    let isSuccess = check(res, {
        [currentFeature + " correct value should return 200 | " + JSON.stringify(usr)]: (r) => r.status === 200,
        [currentFeature + " correct value should have phone property"]: (r) => isEqual(r, "data.phone", user.phone),
        [currentFeature + " correct value should have name property"]: (r) => isEqual(r, "data.name", user.name),
        [currentFeature + " correct value should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })
    if (!isSuccess) {
        console.log("login failed", res.status, res.body)
    }


    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: usr.credentialValue,
        email: "",
        name: user.name,
        password: user.password
    } : null


}
function EmailLoginTest(route, user, doNegativeCase) {
    let res
    const currentFeature = TEST_NAME + "post login email"
    const usr = {
        credentialType: "email",
        credentialValue: user.email,
        password: user.password
    }
    if (doNegativeCase) {
        registerEmailTestObjects.forEach(payload => {
            res = testPostJson(route, payload)
            check(res, {
                [currentFeature + ' wrong value should return 400 | ' + JSON.stringify(payload)]: (r) => r.status === 400,
            })
        })
        res = testPostJson(route, {
            credentialType: "email",
            credentialValue: generateRandomEmail(),
            password: generateRandomPassword()
        })
        check(res, {
            [currentFeature + " non exist user should return 404"]: (r) => r.status === 404
        })
    }

    res = testPostJson(route, usr)
    let isSuccess = check(res, {
        [currentFeature + " correct value should return 200 | " + JSON.stringify(usr)]: (r) => r.status === 200,
        [currentFeature + " correct value should have email property"]: (r) => isEqual(r, "data.email", user.email),
        [currentFeature + " correct value should have name property"]: (r) => isEqual(r, "data.name", user.name),
        [currentFeature + " correct value should have accessToken property"]: (r) => isExists(r, "data.accessToken"),
    })
    if (!isSuccess) {
        console.log("login failed", res.status, res.body)
    }


    return isSuccess ? {
        accessToken: res.json().data.accessToken,
        phone: "",
        email: usr.credentialValue,
        name: user.name,
        password: user.password
    } : null

}