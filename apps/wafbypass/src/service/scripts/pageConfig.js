// https://intoli.com/blog/making-chrome-headless-undetectable/
// https://antoinevastel.com/bot%20detection/2018/01/17/detect-chrome-headless-v2.html
Object.defineProperty(navigator, 'webdriver', { get: () => undefined })

// overwrite the `languages` property to use a custom getter
Object.defineProperty(navigator, 'languages', {
  get: function () {
    return ['pt-BR', 'en-US', 'en']
  },
})

// overwrite the `plugins` property to use a custom getter
Object.defineProperty(navigator, 'plugins', {
  get: function () {
    const pluginData = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ] /** {
      name: string,
      filename: string,
      description: string,
    }[] */
    const pluginArray = []
    pluginData.forEach(p => {
      function FakePlugin() {
        return p
      }
      const plugin = FakePlugin()
      Object.setPrototypeOf(plugin, Plugin.prototype)
      pluginArray.push(plugin)
    })
    Object.setPrototypeOf(pluginArray, PluginArray.prototype)
    return pluginArray
  },
})

WebGLRenderingContext.prototype.getParameter = function (parameter) {
  // UNMASKED_VENDOR_WEBGL
  if (parameter === 37445) {
    return 'Google Inc. (NVIDIA)'
    // return 'Intel Open Source Technology Center';
  }
  // UNMASKED_RENDERER_WEBGL
  if (parameter === 37446) {
    return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11-30.0.14.7196)'
    // return 'Mesa DRI Intel(R) Ivybridge Mobile';
  }

  return new WebGLRenderingContext().getParameter(parameter)
}
;['height', 'width'].forEach(property => {
  // store the existing descriptor
  const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, property)

  // redefine the property with a patched descriptor
  Object.defineProperty(HTMLImageElement.prototype, property, {
    ...imageDescriptor,
    get: function () {
      // return an arbitrary non-zero dimension if the image failed to load
      if (this.complete && this.naturalHeight === 0) return 20

      // otherwise, return the actual dimension
      return imageDescriptor.get.apply(this)
    },
  })
})

// store the existing descriptor
const elementDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

// redefine the property with a patched descriptor
Object.defineProperty(HTMLDivElement.prototype, 'offsetHeight', {
  ...elementDescriptor,
  get: function () {
    if (this.id === 'modernizr') return 1

    return elementDescriptor.get.apply(this)
  },
})