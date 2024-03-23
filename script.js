import { TestRegistration } from './testCases/registerTest.js';
import { TestLogin } from './testCases/loginTest.js';
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
  let [userByPhone, userByEmail] = TestRegistration(true)
  if (!userByPhone || !userByEmail) return

  [userByPhone, userByEmail] = TestLogin(userByPhone, userByEmail, true)
  if (!userByPhone || !userByEmail) return

  [userByPhone, userByEmail] = TestLinkCredential(userByPhone, userByEmail, true)
  if (!userByPhone || !userByEmail) return

  userByPhone = TestUpdateAccount(userByPhone, true)
  userByPhone = TestUpload(userByPhone, true)

  userByPhone = TestFriends(userByPhone, true)
  userByPhone = TestPost(userByPhone, true)
  userByPhone = TestPostComment(userByPhone, true)
}
