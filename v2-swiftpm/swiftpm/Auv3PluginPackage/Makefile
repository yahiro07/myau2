PROJECT := ../../xcode/Project1.xcodeproj
SCHEME := Project1Extension
DERIVED_DATA := ../../xcode/.build/Project1Extension

build_swift:
	swift build

build_full:
	rm -rf .build
	swift build -Xswiftc -Xfrontend -Xswiftc -warn-long-function-bodies=100
	
build:
	xcodebuild -project "$(PROJECT)" -scheme "$(SCHEME)" -destination platform=macOS -derivedDataPath "$(DERIVED_DATA)" build

run: build
	$(DERIVED_DATA)/Build/Products/Debug/Project1.app/Contents/MacOS/Project1

