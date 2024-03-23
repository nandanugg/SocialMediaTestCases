# ProjectSprint! Social Media Test Cases

### Prerequisites
- [K6](https://k6.io/docs/get-started/installation/)
- A linux environment (WSL / MacOS should be fine)


### Environment Variables
- `BASE_URL` fill this with your backend url (eg: `http://localhost:8080`)

### How to run
#### For regular testing
```bash
BASE_URL=http://localhost:8080 k6 run script.js
```
#### For load testing
```bash
BASE_URL=http://localhost:8080 REAL_WORLD_CASE=true k6 run --vus 300 -i 300 script.js
```