.PHONY: build

build:
	@echo building...
	xcodebuild -project MySynth1.xcodeproj -target MySynth1 -configuration Debug

# install: build
# 	rm -rf $(HOME)/Applications/MySynth1.app
# 	cp -r build/Debug/MySynth1.app $(HOME)/Applications/MySynth1.app

run: build
	@killall MySynth1 2>/dev/null || true
	build/Debug/MySynth1.app/Contents/MacOS/MySynth1

# 	"$(HOME)/Applications/MySynth1.app/Contents/MacOS/MySynth1"

clean:
	rm -rf build

list_installed:
	mdfind "kMDItemCFBundleIdentifier == 'net.miqsel.synth2511.MySynth1'"

remove_installed:
	rm -rf $(HOME)/Applications/MySynth1.app

start_log_server:
	cd log-server && make run

start_fe_dev_server:
	cd frontend && npm run dev

build_fe:
	cd frontend && npm run build

