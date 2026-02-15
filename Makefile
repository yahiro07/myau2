.PHONY: build

build:
	@echo building...
	xcodebuild -project myau2.xcodeproj -target myau2 -configuration Debug

# install: build
# 	rm -rf $(HOME)/Applications/myau2.app
# 	cp -r build/Debug/myau2.app $(HOME)/Applications/myau2.app

run: build
	@killall myau2 2>/dev/null || true
	build/Debug/myau2.app/Contents/MacOS/myau2

# 	"$(HOME)/Applications/myau2.app/Contents/MacOS/myau2"

clean:
	rm -rf build

list_installed:
	mdfind "kMDItemCFBundleIdentifier == 'net.miqsel.synth2511.myau2'"

remove_installed:
	rm -rf $(HOME)/Applications/myau2.app