// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
  name: "Auv3PluginPackage",
  platforms: [.macOS(.v14), .iOS(.v16)],
  products: [
    .library(name: "Auv3PluginPackage", targets: ["FrameworkMain", "Auv3HostApp"])
  ],
  targets: [
    .target(
      name: "Dsp",
      publicHeadersPath: "",
    ),
    .target(
      name: "DspRoute",
      dependencies: ["Dsp"],
      publicHeadersPath: "include"
    ),
    .target(
      name: "FrameworkMain",
      dependencies: ["DspRoute"],
      resources: [
        .copy("Resources/pages")
      ],
      swiftSettings: [
        .interoperabilityMode(.Cxx)
      ]
    ),
    .target(
      name: "Auv3HostApp",
      resources: [
        .process("Resources/dummy.aif")
      ]
    ),
  ],
  cxxLanguageStandard: .cxx20
)
