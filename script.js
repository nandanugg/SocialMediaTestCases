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
  // eslint-disable-next-line no-undef
  const ONLY_POSITIVE = __ENV.ONLY_POSITIVE ? true : false
  // eslint-disable-next-line no-undef
  // const REAL_WORLD = __ENV.REAL_WORLD ? true : false

  let [userByPhone, userByEmail] = TestRegistration(!ONLY_POSITIVE)
  if (!userByPhone || !userByEmail) return

  [userByPhone, userByEmail] = TestLogin(userByPhone, userByEmail, !ONLY_POSITIVE)
  if (!userByPhone || !userByEmail) return

  [userByPhone, userByEmail] = TestLinkCredential(userByPhone, userByEmail, !ONLY_POSITIVE)
  if (!userByPhone || !userByEmail) return

  userByPhone = TestUpdateAccount(userByPhone, !ONLY_POSITIVE)
  userByPhone = TestUpload(userByPhone, !ONLY_POSITIVE)

  userByPhone = TestFriends(userByPhone, !ONLY_POSITIVE)
  userByPhone = TestPost(userByPhone, !ONLY_POSITIVE)
  userByPhone = TestPostComment(userByPhone, !ONLY_POSITIVE)
}
