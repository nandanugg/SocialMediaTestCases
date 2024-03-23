import { TestRegistration, TestPhoneRegistration, TestEmailRegistration } from './testCases/registerTest.js';
import { TestLogin, TestEmailLogin, TestPhoneLogin } from './testCases/loginTest.js';
import { TestUpdateAccount } from './testCases/updateAccountTest.js';
import { TestUpload } from './testCases/uploadFileTest.js';
import { TestLinkCredential } from './testCases/linkPhoneNumberOrEmailTest.js';
import { TestFriends } from './testCases/friendsTest.js';
import { TestPost } from './testCases/postTest.js';
import { TestPostComment } from './testCases/postCommentTest.js';

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 1,
  // A string specifying the total duration of the test run.
  iterations: 1,
};

// The function that defines VU logic.
//
// See https://grafana.com/docs/k6/latest/examples/get-started-with-k6/ to learn more
// about authoring k6 scripts.
//
export default function () {
  // eslint-disable-next-line no-undef
  const ONLY_POSITIVE_CASE = __ENV.ONLY_POSITIVE ? true : false
  // eslint-disable-next-line no-undef
  const REAL_WORLD_CASE = __ENV.REAL_WORLD_CASE ? true : false;

  if (REAL_WORLD_CASE) {
    // 30% of users have negative cases
    const runPositiveCase = Math.random() > 0.3 ? true : false;
    let userByPhone = null;
    let userByEmail = null;
    let user = null;

    // 70% of users use phone registration
    if (Math.random() > 0.3) {
      userByPhone = TestPhoneRegistration(!runPositiveCase);
    } else {
      userByEmail = TestEmailRegistration(!runPositiveCase);
    }

    // for each of the user, run login once
    if (userByPhone) {
      userByPhone = TestPhoneLogin(userByPhone, !runPositiveCase);
    }
    if (userByEmail) {
      userByEmail = TestEmailLogin(userByEmail, !runPositiveCase);
    }


    if ((userByPhone || userByEmail) && Math.random() > 0.5) {
      // 50% of the user add a friend
      TestFriends(userByPhone || userByEmail, !runPositiveCase);

      if (Math.random() > 0.3) {
        // 70% of the user that add a friend, post something 
        TestUpload(userByPhone || userByEmail, !runPositiveCase);
        const usrPos = TestPost(userByPhone || userByEmail, !runPositiveCase);
        if (Math.random() > 0.3) {
          // 70% of the user that add a friend and post something, will comment 
          TestPostComment(usrPos, !runPositiveCase);
        }
      }
      if ((userByPhone || userByEmail) && Math.random() > 0.5) {
        // 50% of the user that registers, change their credential
        user = TestLinkCredential(userByPhone || userByEmail, !runPositiveCase);
        if (Math.random() > 0.5) {
          // 50% of the users that add a friend, update their account
          TestUpdateAccount(user, !runPositiveCase);
        }
      }
    }
  } else {
    let userByPhone, userByEmail = null

    // add loop in order to test add friend feature
    for (let index = 0; index < 50; index++) {
      [userByPhone, userByEmail] = TestRegistration(!ONLY_POSITIVE_CASE);
      if (!userByPhone || !userByEmail) return;

      [userByPhone, userByEmail] = TestLogin(userByPhone, userByEmail, !ONLY_POSITIVE_CASE);
      if (!userByPhone || !userByEmail) return;
    }

    [userByPhone, userByEmail] = TestLinkCredential(userByPhone, userByEmail, !ONLY_POSITIVE_CASE);
    if (!userByPhone || !userByEmail) return;

    userByPhone = TestUpdateAccount(userByPhone, !ONLY_POSITIVE_CASE);
    userByPhone = TestUpload(userByPhone, !ONLY_POSITIVE_CASE);

    userByPhone = TestFriends(userByPhone, !ONLY_POSITIVE_CASE);
    userByPhone = TestPost(userByPhone, !ONLY_POSITIVE_CASE);
    userByPhone = TestPostComment(userByPhone, !ONLY_POSITIVE_CASE);
  }
}
