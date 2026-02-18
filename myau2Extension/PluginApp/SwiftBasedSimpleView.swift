import AUv3Framework
import AudioToolbox
import SwiftUI

struct Knob: View {
  var label: String? = nil
  @Binding var value: Float
  @State private var startValue: Float = 0

  var body: some View {
    VStack {
      ZStack {
        Circle()
          .fill(.gray)
          .stroke(.white, lineWidth: 3.0)
          .frame(width: 50, height: 50)
        Circle()
          .fill(.gray)
          .stroke(.white, lineWidth: 3.0)
          .frame(width: 40, height: 40)
        Rectangle()
          .fill(.black)
          .frame(width: 4, height: 20)
          .offset(y: -10)
          .rotationEffect(.degrees(Double(value) * 270 - 135))
      }
      .contentShape(Circle())
      .gesture(
        DragGesture(minimumDistance: 0).onChanged { gesture in
          if gesture.translation.height == 0 {
            startValue = value
          }
          let delta = Float(-gesture.translation.height / 100)
          var newValue = startValue + delta
          newValue = min(max(newValue, 0.0), 1.0)
          value = newValue
        })
      if let label = label {
        Text(label)
      }
    }
  }
}

struct TogglePad: View {
  var label: String? = nil
  @Binding var active: Bool

  var body: some View {
    VStack {
      ZStack {
        Circle()
          .opacity(0.0)
          .frame(width: 50, height: 50)
        Circle()
          .fill(active ? .blue : .gray)
          .stroke(.white, lineWidth: 3.0)
          .frame(width: 30, height: 30)
      }.onTapGesture {
        active.toggle()
      }
      if let label = label {
        Text(label)
      }
    }
  }
}

struct PadButton: View {
  var label: String? = nil
  @State private var hold: Bool = false

  var onPress: (() -> Void)? = nil
  var onRelease: (() -> Void)? = nil

  var body: some View {
    VStack {
      ZStack {
        Rectangle()
          .fill(hold ? .blue : .gray)
          .frame(width: 50, height: 50)
        if let label = label {
          Text(label)
        }
      }.gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { _ in
            hold = true
            onPress?()
          }
          .onEnded { _ in
            hold = false
            onRelease?()
          }
      )
    }
  }
}

extension ObservableAUParameter {
  var bindUnary: Binding<Float> {
    Binding(
      get: { self.value },
      set: { self.value = $0 }
    )
  }
  var bindBool: Binding<Bool> {
    Binding(
      get: { self.value > 0.5 },
      set: { self.value = $0 ? 1.0 : 0.0 }
    )
  }

  var bindEnum: Binding<Int> {
    Binding(
      get: { Int(self.value.rounded()) },
      set: { self.value = Float($0) }
    )
  }
}

struct SwiftBasedSimpleView: View {
  private let parameterTree: ObservableAUParameterGroup

  init(_ parameterTree: AUParameterTree) {
    self.parameterTree = ObservableAUParameterGroup(parameterTree)
  }

  var body: some View {
    let ptFlat: (ParameterAddressInSwift) -> ObservableAUParameter =
      flattenObservableParametersByAddress(parameterTree)
    VStack {
      Text("My Plugin 1443").bold().font(.largeTitle)
      HStack(spacing: 60) {
        VStack(spacing: 20) {
          HStack(spacing: 100) {
            Text("OSC1").bold().font(.title)
            Picker("Wave", selection: ptFlat(.osc1Wave).bindEnum) {
              Text("Saw").tag(0)
              Text("Rect").tag(1)
              Text("Tri").tag(2)
              Text("Sine").tag(3)
              Text("Noise").tag(4)
            }
          }
          Picker("OSC Wave", selection: ptFlat(.osc1Wave).bindEnum) {
            Text("Saw").tag(0)
            Text("Rect").tag(1)
            Text("Tri").tag(2)
            Text("Sine").tag(3)
            // Text("Noise").tag(4)
          }.pickerStyle(.segmented)
            .frame(width: 250)
          HStack(spacing: 40) {
            Knob(label: "Octave", value: ptFlat(.osc1Octave).bindUnary)
            Knob(label: "PW/Mix", value: ptFlat(.osc1PwMix).bindUnary)
            Knob(label: "Volume", value: ptFlat(.osc1Volume).bindUnary)
          }
        }

        VStack(spacing: 20) {
          HStack(spacing: 100) {
            Text("Filter").bold().font(.title)
            Picker("Type", selection: ptFlat(.filterType).bindEnum) {
              Text("LPF").tag(0)
              Text("BPF").tag(1)
              Text("HPF").tag(2)
            }
          }
          Picker("Type", selection: ptFlat(.filterType).bindEnum) {
            Text("LPF").tag(0)
            Text("BPF").tag(1)
            Text("HPF").tag(2)
          }.pickerStyle(.segmented)
            .frame(width: 250)
          HStack(spacing: 40) {
            Knob(label: "Cutoff", value: ptFlat(.filterCutoff).bindUnary)
            Knob(label: "Peak", value: ptFlat(.filterPeak).bindUnary)
            Knob(label: "EnvMod", value: ptFlat(.filterEnvMod).bindUnary)
          }
        }
      }

      HStack(spacing: 60) {

        VStack(spacing: 20) {
          HStack(spacing: 100) {
            Text("OSC2").bold().font(.title)
            Picker("Wave", selection: ptFlat(.osc2Wave).bindEnum) {
              Text("Saw").tag(0)
              Text("Rect").tag(1)
              Text("Tri").tag(2)
              Text("Sine").tag(3)
              Text("Noise").tag(4)
            }
          }
          Picker("OSC Wave", selection: ptFlat(.osc2Wave).bindEnum) {
            Text("Saw").tag(0)
            Text("Rect").tag(1)
            Text("Tri").tag(2)
            Text("Sine").tag(3)
            // Text("Noise").tag(4)
          }.pickerStyle(.segmented)
            .frame(width: 250)
          HStack(spacing: 40) {
            Knob(label: "Octave", value: ptFlat(.osc2Octave).bindUnary)
            Knob(label: "Detune", value: ptFlat(.osc2Detune).bindUnary)
            Knob(label: "Volume", value: ptFlat(.osc2Volume).bindUnary)
          }
        }

        VStack(spacing: 20) {
          HStack(spacing: 100) {
            Text("Amplifier").bold().font(.title)
          }
          HStack(spacing: 40) {
            Knob(label: "Attack", value: ptFlat(.ampAttack).bindUnary)
            Knob(label: "Decay", value: ptFlat(.ampDecay).bindUnary)
            Knob(label: "Sustain", value: ptFlat(.ampSustain).bindUnary)
            Knob(label: "Release", value: ptFlat(.ampRelease).bindUnary)
          }
        }
      }

      HStack(spacing: 60) {
        VStack(spacing: 20) {
          HStack(spacing: 40) {
            Knob(label: "Glide", value: ptFlat(.glide).bindUnary)
            TogglePad(label: "Mono", active: ptFlat(.voicingMode).bindBool)
            // TogglePad(label: "Osc On", active: ptFlat(.oscOn).bindBool)
          }.frame(width: 200)
        }

        VStack(spacing: 20) {
          HStack(spacing: 100) {
            Text("LFO").bold().font(.title)
            Picker("Dest", selection: ptFlat(.lfoTarget).bindEnum) {
              Text("None").tag(0)
              Text("OSC1 Pitch").tag(1)
              Text("OSC1 PW/Mix").tag(2)
              Text("OSC1 Volume").tag(3)
              Text("OSC2 Pitch").tag(4)
              Text("OSC2 Detune").tag(5)
              Text("OSC2 Volume").tag(6)
              Text("Filter Cutoff").tag(7)
              Text("Amp Volume").tag(8)
            }
          }
          Picker("Wave", selection: ptFlat(.lfoWave).bindEnum) {
            Text("Saw").tag(0)
            Text("Rect").tag(1)
            Text("Tri").tag(2)
            Text("Sine").tag(3)
          }.pickerStyle(.segmented).frame(width: 250)
          HStack(spacing: 40) {
            Knob(label: "Rate", value: ptFlat(.lfoRate).bindUnary)
            Knob(label: "Depth", value: ptFlat(.lfoDepth).bindUnary)
          }
        }
      }

      HStack(spacing: 10) {
        PadButton(
          label: "C",
          onPress: {
            print("C Pressed")
          },
          onRelease: {
            print("C Released")
          })
        PadButton(label: "D")
        PadButton(label: "E")
        PadButton(label: "F")
        PadButton(label: "G")
        PadButton(label: "A")
        PadButton(label: "B")
        PadButton(label: "C")
      }

    }.padding(50)
      .background(.blue.opacity(0.1))
  }
}

// #Preview {
//   MyPluginContentView0()
// }
