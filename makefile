.PHONY: run
run:
	k6 run script.js

.PHONY: run50
run50:
	REAL_WORLD_CASE=true k6 run -i 50 --vus 50 script.js

.PHONY: run100
run100:
	REAL_WORLD_CASE=true k6 run -i 100 --vus 100 script.js

.PHONY: run200
run200:
	REAL_WORLD_CASE=true k6 run -i 200 --vus 200 script.js

.PHONY: run300
run300:
	REAL_WORLD_CASE=true k6 run -i 300 --vus 300 script.js

.PHONY: run600
run600:
	REAL_WORLD_CASE=true k6 run -i 600 --vus 600 script.js