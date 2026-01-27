const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加SVG支持
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// 确保正确解析react-native-svg模块
// 使用编译后的代码而不是源代码
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return context.resolveRequest(context, 'react-native-svg/lib/commonjs/index.js', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;