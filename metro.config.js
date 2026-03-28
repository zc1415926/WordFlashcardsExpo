const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// SVG 支持：从 assetExts 移除，添加到 sourceExts
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// 确保字体文件在 assetExts 中
const fontExts = ['ttf', 'otf', 'woff', 'woff2'];
fontExts.forEach(ext => {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
});

// 确保正确解析react-native-svg模块
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return context.resolveRequest(context, 'react-native-svg/lib/commonjs/index.js', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
