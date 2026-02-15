//
//  TypeAliases.swift
//  myau2
//
//  Created by ore on 2026/02/09.
//

import AudioToolbox
import CoreMIDI

#if os(iOS) || os(visionOS)
  import UIKit

  public typealias ViewController = UIViewController
#elseif os(macOS)
  import AppKit

  public typealias KitView = NSView
  public typealias ViewController = NSViewController
#endif
