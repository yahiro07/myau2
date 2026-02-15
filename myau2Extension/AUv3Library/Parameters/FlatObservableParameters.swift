import Foundation

@MainActor
struct FlatObservableParameters {
  var entries: [String: ObservableAUParameter] = [:]
  init(parameterTree: ObservableAUParameterGroup) {
    appendParameters(from: parameterTree)
  }

  private mutating func appendParameters(from group: ObservableAUParameterGroup) {
    for (identifier, node) in group.children {
      if let parameter = node as? ObservableAUParameter {
        assert(
          entries[identifier] == nil,
          "Duplicate parameter identifier '\(identifier)' found while flattening the parameter tree"
        )
        entries[identifier] = parameter
        continue
      }

      if let subgroup = node as? ObservableAUParameterGroup {
        appendParameters(from: subgroup)
        continue
      }
    }
  }
}
