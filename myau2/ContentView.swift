//
//  ContentView.swift
//  myau2
//
//  Created by ore on 2026/02/09.
//

import AudioToolbox
import SwiftUI

struct TouchPad: View {
  let onChange: () -> Void
  let onEnded: () -> Void

  @State private var isActive = false

  var touch: some Gesture {
    DragGesture(minimumDistance: 0.0, coordinateSpace: .local)
      .onChanged { gesture in
        if self.isActive {
          return
        }

        self.isActive = true
        self.onChange()
      }
      .onEnded { _ in
        self.isActive = false
        self.onEnded()
      }
  }
  var body: some View {
    Text(Image(systemName: "music.quarternote.3"))
      .font(.system(size: 48))
      .frame(width: 64, height: 64)
      .background(.indigo)
      .foregroundColor(.white)
      .clipShape(Circle())
      .gesture(self.touch)
      .accessibilityAddTraits(.allowsDirectInteraction)
      .accessibilityLabel("Play")
  }
}

struct ContentView: View {
  let hostModel: AudioUnitHostModel
  @State private var isSheetPresented = false

  var margin = 10.0
  var doubleMargin: Double {
    margin * 2.0
  }

  var body: some View {
    VStack {
      VStack {
        if hostModel.audioUnitCrashed {
          HStack(spacing: 2) {
            Text("(\(hostModel.viewModel.title))")
              .textSelection(.enabled)
            Text("crashed!")
          }
          ValidationView(hostModel: hostModel, isSheetPresented: $isSheetPresented)
        } else {
          VStack {
            Text("\(hostModel.viewModel.title)")
              .textSelection(.enabled)
              .bold()
            ValidationView(hostModel: hostModel, isSheetPresented: $isSheetPresented)

            TouchPad(
              onChange: {
                self.hostModel.noteOn(index: 60)
              },
              onEnded: {
                self.hostModel.noteOff(index: 60)
              })
            VStack {
              Button("test") {
                print("test button pressed")
              }
            }.padding(20).border(Color.blue, width: 2)

            if let viewController = hostModel.viewModel.viewController {
              AUViewControllerUI(viewController: viewController)
                .frame(minWidth: 400, minHeight: 200)
                .padding(margin)
            } else {
              Text(hostModel.viewModel.message)
                .frame(minWidth: 400, minHeight: 200)
            }
          }
        }
      }
      .padding(doubleMargin)

      if hostModel.viewModel.showAudioControls {
        Text("Audio Playback")
        Button {
          hostModel.isPlaying ? hostModel.stopPlaying() : hostModel.startPlaying()

        } label: {
          Text(hostModel.isPlaying ? "Stop" : "Play")
        }
      }
      if hostModel.viewModel.showMIDIControls {
        Text("MIDI Input: Enabled")
      }
      Spacer()
        .frame(height: margin)

    }.background(.blue.opacity(0.05))
  }
}

#Preview {
  ContentView(hostModel: AudioUnitHostModel())
}
