# 知云闪卡 (WordFlashcardsExpo)

一款基于 React Native 和 Expo 开发的英汉单词闪卡学习应用。

## 功能特性

- **单词管理**：添加、编辑、删除单词，查看单词列表
- **学习模式**：支持顺序/乱序、英语→汉语/汉语→英语四种学习模式
- **闪卡交互**：左右滑动手势切换卡片，点击查看答案
- **数据导入/导出**：支持 CSV 文件导入导出，方便批量管理单词
- **语音朗读**：使用 Expo Speech 进行英语单词发音

## 技术栈

- **框架**：React Native 0.81.5 + Expo ~54.0.32
- **导航**：React Navigation v7
- **存储**：@react-native-async-storage/async-storage
- **UI 组件**：React Native 原生组件 + react-native-svg
- **构建工具**：EAS Build (Expo Application Services)

## 安装与运行

### 环境要求

- Node.js >= 18
- npm 或 yarn
- Expo CLI (`npm install -g expo-cli`)

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
# 或
npx expo start
```

### 运行到特定平台

```bash
npm run android   # Android 模拟器/设备
npm run ios       # iOS 模拟器（仅 macOS）
npm run web       # Web 浏览器
```

## 构建发布

### 使用 EAS Build

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账户
eas login

# 预览构建（内部测试 APK）
eas build --profile preview --platform android

# 生产构建
eas build --profile production --platform android
```

### 构建配置

构建配置文件位于 `eas.json`：

- `development`：开发构建（带开发客户端）
- `preview`：预览构建（内部测试 APK）
- `production`：生产构建

## 数据格式

### CSV 导入/导出格式

```csv
hello,你好
world,世界
apple,苹果
```

- 每行一个单词
- 格式：`英语单词,汉语意思`
- 支持 UTF-8 编码

## 项目结构

```
.
├── App.tsx                    # 应用入口组件
├── app.json                   # Expo 配置文件
├── eas.json                   # EAS 构建配置
├── package.json               # 项目依赖
├── assets/                    # 静态资源（图标、启动图）
└── src/
    ├── Navigation.tsx         # 导航配置
    ├── types.ts               # TypeScript 类型定义
    ├── components/            # 可复用组件
    │   ├── FlashCard.tsx      # 闪卡组件
    │   └── PageHeader.tsx     # 页面标题栏
    ├── screens/               # 页面组件
    │   ├── HomeScreen.tsx     # 首页
    │   ├── StudyScreen.tsx    # 学习页面
    │   ├── WordManagementScreen.tsx
    │   └── ImportScreen.tsx
    └── services/
        ├── StorageService.ts  # 本地存储服务
        └── TTSService.ts      # 语音合成服务
```

## 版本历史

### v1.0.1
- 修复编辑单词后顺序被移到末尾的问题
- 完善应用配置信息

### v1.0.0
- 初始版本发布
- 支持单词管理、学习模式、导入导出

## 开源协议

MIT License
