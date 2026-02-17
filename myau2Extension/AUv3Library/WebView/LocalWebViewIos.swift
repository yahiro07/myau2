#if os(iOS)

  struct LocalWebView: UIViewRepresentable {
    // iOSではUIViewRepresentableを使用

    func makeUIView(context: Context) -> WKWebView {
      let config = WKWebViewConfiguration()
      config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

      let webView = WKWebView(frame: .zero, configuration: config)

      loadPage(webView)
      return webView
    }

    func loadPage(_ webView: WKWebView) {
      guard
        let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist")
      else {
        print("Invalid URL")
        return
      }
      print("Load URL: \(url)")
      webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    func updateUIView(_ webView: WKWebView, context: Context) {

    }

  }
#endif
