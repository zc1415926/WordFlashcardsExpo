# WordFlashcardsExpo - 项目上下文文档

## 项目概述

**WordFlashcardsExpo** 是一个基于 React Native 和 Expo 开发的单词闪卡学习应用。用户可以通过该应用添加、管理和学习英汉对照的单词卡片，支持多种学习模式和手势交互。

### 主要功能

- **单词管理**：添加、编辑、删除单词，查看单词列表
- **学习模式**：支持顺序/乱序、英语→汉语/汉语→英语四种学习模式
- **闪卡交互**：左右滑动手势切换卡片，点击查看答案
- **数据导入/导出**：支持 CSV 文件导入导出，方便批量管理单词
- **语音朗读**：使用 Expo Speech 进行英语单词发音

### 技术栈

- **框架**：React Native 0.81.5 + Expo ~54.0.32
- **导航**：React Navigation v7 (@react-navigation/native-stack)
- **存储**：@react-native-async-storage/async-storage
- **UI 组件**：React Native 原生组件 + react-native-svg
- **构建工具**：EAS Build (Expo Application Services)

---

## 项目结构

```
/home/zc1415926/WordFlashcardsExpo/
├── App.tsx                    # 应用入口组件
├── index.ts                   # Expo 根组件注册
├── app.json                   # Expo 配置文件
├── eas.json                   # EAS 构建配置
├── package.json               # 项目依赖
├── words.csv                  # 示例单词数据文件
├── assets/                    # 静态资源（图标、启动图）
└── src/
    ├── Navigation.tsx         # 导航配置
    ├── types.ts               # TypeScript 类型定义
    ├── components/            # 可复用组件
    │   ├── FlashCard.tsx      # 闪卡组件（核心交互）
    │   └── PageHeader.tsx     # 页面标题栏组件
    ├── screens/               # 页面组件
    │   ├── HomeScreen.tsx     # 首页（主菜单）
    │   ├── StudyScreen.tsx    # 学习页面
    │   ├── WordManagementScreen.tsx  # 单词管理页面
    │   └── ImportScreen.tsx   # 导入页面
    └── services/              # 服务层
        ├── StorageService.ts  # 本地存储服务
        └── TTSService.ts      # 语音合成服务
```

---

## 构建和运行

### 开发环境启动

```bash
# 启动 Expo 开发服务器
npm start
# 或
npx expo start

# 在特定平台运行
npm run android   # Android 模拟器/设备
npm run ios       # iOS 模拟器（仅 macOS）
npm run web       # Web 浏览器
```

### 生产构建

使用 EAS Build 进行生产构建：

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账户
eas login

# 开发构建（带开发客户端）
eas build --profile development --platform android

# 预览构建（内部测试 APK）
eas build --profile preview --platform android

# 生产构建
eas build --profile production --platform android
```

---

## 核心模块说明

### 1. 导航结构 (Navigation.tsx)

使用 React Navigation 的 Native Stack Navigator：

| 路由名称 | 页面组件 | 参数 |
|---------|---------|------|
| Home | HomeScreen | - |
| WordManagement | WordManagementScreen | `action?: 'export' \| 'import'` |
| Study | StudyScreen | `mode: 'english-to-chinese' \| 'chinese-to-english'`, `shuffle: boolean` |
| Import | ImportScreen | - |

### 2. 数据模型 (types.ts)

```typescript
interface WordCard {
  id: string;           // 唯一标识
  english: string;      // 英语单词
  chinese: string;      // 汉语意思
  createdAt: number;    // 创建时间戳
}

type StudyMode = 'english-to-chinese' | 'chinese-to-english';
```

### 3. 存储服务 (StorageService.ts)

使用 AsyncStorage 持久化存储：

- `getWords()`: 获取所有单词
- `saveWords(words)`: 保存单词列表
- `addWord(word)`: 添加新单词
- `deleteWord(id)`: 删除指定单词
- `clearAllWords()`: 清空所有数据

存储键名：`@word_flashcards`

### 4. 闪卡组件 (FlashCard.tsx)

核心交互组件，实现以下功能：

- **双卡片预加载**：使用两个卡片（A/B）实现平滑切换动画
- **手势支持**：左右滑动切换上/下一个单词
- **翻转动画**：点击查看答案/返回问题
- **自适应字体**：根据文本长度自动调整字体大小
- **动画效果**：使用 React Native Animated API

### 5. 导入/导出功能

**导入**：
- 支持 CSV 文件选择（使用 expo-document-picker）
- 支持直接粘贴 CSV 文本
- 格式：`英语单词,汉语意思`（每行一个）
- 支持追加和覆盖两种模式

**导出**：
- 导出为 UTF-8 编码的 CSV 文件
- 添加 BOM 头确保 Excel 正确识别
- 使用 expo-sharing 分享文件
- 失败时自动降级到剪贴板

---

## 开发约定

### 代码风格

- 使用 TypeScript 进行类型检查
- 函数组件 + React Hooks
- 样式使用 StyleSheet.create 定义
- 颜色主题统一使用常量：
  - 主背景色：`#FFE4B5`（浅橙色）
  - 主按钮色：`#4ECDC4`（青绿色）
  - 强调色：`#FF6B6B`（珊瑚红）
  - 次要按钮：`#95E1D3`（浅青绿）

### 组件规范

- 页面组件位于 `src/screens/`
- 可复用组件位于 `src/components/`
- 服务类位于 `src/services/`
- 使用 `SafeAreaView` 处理刘海屏
- 使用 `useSafeAreaInsets` 获取安全区域

### 文件操作说明

项目使用 `expo-file-system/legacy` 模块：
- 原因：新 API 的 File 对象缺少 text() 方法
- 文档目录：`FileSystem.documentDirectory`

---

## 依赖说明

### 核心依赖

| 包名 | 版本 | 用途 |
|-----|------|-----|
| expo | ~54.0.32 | Expo SDK |
| react | 19.1.0 | React |
| react-native | 0.81.5 | React Native |
| @react-navigation/native | ^7.1.28 | 导航核心 |
| @react-navigation/native-stack | ^7.11.0 | 原生栈导航 |

### Expo 模块

| 包名 | 用途 |
|-----|------|
| expo-speech | 语音合成（TTS） |
| expo-document-picker | 文件选择 |
| expo-file-system | 文件系统操作 |
| expo-sharing | 系统分享 |
| expo-clipboard | 剪贴板操作 |
| expo-dev-client | 开发客户端 |

### 其他依赖

| 包名 | 用途 |
|-----|------|
| @react-native-async-storage/async-storage | 本地存储 |
| react-native-svg | SVG 图标 |
| react-native-safe-area-context | 安全区域处理 |

---

## 注意事项

1. **Metro 配置**：项目使用 `metro.config.js` 处理特定配置
2. **TypeScript**：严格类型检查启用
3. **Android 配置**：支持自适应图标、edge-to-edge 显示
4. **新架构**：`newArchEnabled: true` 启用 React Native 新架构
5. **文件导入**：CSV 文件需要 UTF-8 编码，Windows Excel 可能需要手动选择编码

---

## 示例数据格式

`words.csv`：
```csv
hello,你好
hi,嗨
goodbye,再见
```
