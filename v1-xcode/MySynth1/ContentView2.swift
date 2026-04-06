import AudioToolbox
import SwiftUI

struct ContentView2: View {
  let hostModel: AudioUnitHostModel
  @State private var isSheetPresented = false

  var body: some View {
    if let viewController = hostModel.viewModel.viewController {
      VStack {
        AUViewControllerUI(viewController: viewController)
      }
      //ここにborderをつけるとAUViewControllerUIの内部が操作できなくなるので注意
      //プロセス境界をまたぐビューの親にborderをつけるとヒットテストが効かなくなっていそう
      //MacOSで発生しiPadでは問題ない NSViewとViewの互換性や相性の問題?
      //backgroundなどは問題ない
      //.border(Color.red, width: 2) //BAD!!
    } else {
      Text(hostModel.viewModel.message)
        .frame(minWidth: 400, minHeight: 200)
    }
  }
}

#Preview {
  ContentView2(hostModel: AudioUnitHostModel())
}
