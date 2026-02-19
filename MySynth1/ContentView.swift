import AudioToolbox
import SwiftUI

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
