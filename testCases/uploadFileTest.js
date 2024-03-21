import http from 'k6/http';
import { check } from 'k6';
import { isExists } from '../helper.js';
const TEST_NAME = "(upload test)"

// Prepare the payload using the file to be uploaded
var payload = {
    file: http.file(open('../figure/image15KB.jpg', 'b'), 'image1.jpg'),
};


export function UploadTest(user, doNegativeCase) {
    let res;
    let route = __ENV.BASE_URL + "/v1/image"
    const currentFeature = TEST_NAME
    const headers = { "Authorization": "Bearer " + user.accessToken }

    if (doNegativeCase) {
        // Negative case, empty auth
        res = http.post(route, {}, {});
        check(res, {
            [currentFeature + "post upload file empty auth should return 401"]: (v) => v.status === 401
        })
        // Negative case, empty file 
        res = http.post(route, {}, headers);
        check(res, {
            [currentFeature + "post upload file empty file should return 400"]: (v) => v.status === 400
        })
    }

    // Positive case, upload file
    res = http.post(route, payload, headers);
    let isSuccess = check(res, {
        [currentFeature + "correct file should return 200"]: (v) => v.status === 200,
        [currentFeature + "correct file should have imageUrl"]: (v) => isExists(v, "data.imageUrl"),
    })

    if (!isSuccess) return

    user.imageUrls.push(res.json().imageUrl)

    return user
}