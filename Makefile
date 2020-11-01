.EXPORT_ALL_VARIABLES:
BUCKET = $(shell aws ssm get-parameter --name /account/app-bucket | jq -r .Parameter.Value)

.PHONY: build
build: 
	@sam build

.PHONY: test
test: 
	bash test.sh

.PHONY: package
package: build
	@sam package --s3-bucket $$BUCKET

.PHONY: deploy
deploy: package
	@sam deploy \
		--s3-bucket $$BUCKET \
		--stack-name TimestreamPoc-mike \
		--capabilities CAPABILITY_NAMED_IAM \
		--no-fail-on-empty-changeset --tags logical_name=TimestreamPoc-mike