# ProjectSprint! Social Media Test Cases

### Prerequisites
- [K6](https://k6.io/docs/get-started/installation/)


### Environment Variables
- `BASE_URL` fill this with your backend url (eg: `http://localhost:8080`)

### How to run
#### For regular testing
```bash
BASE_URL=http://localhost:8080 k6 run -i 1 --vus 1 script.js
```