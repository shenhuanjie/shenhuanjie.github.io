---
title: 技术文章：使用Java进行微信ID和手机号码检测
date: '2024-04-25 16:52:18'
updated: '2024-04-25 17:10:47'
permalink: >-
  /post/technical-article-use-java-to-conduct-wechat-id-and-mobile-phone-number-detection-z1rxok6.html
comments: true
toc: true
---

### 摘要

本文将介绍一个Java程序，该程序能够检测文本中的微信ID和手机号码，并将其屏蔽。程序首先定义了一系列与微信相关的关键字，然后使用正则表达式来匹配合法的手机号码和微信ID。最后，该程序将检测到的手机号码和微信ID替换为星号，以保护用户隐私。

### 1. 程序介绍

随着社交媒体的普及，个人隐私保护变得越来越重要。在某些情况下，我们可能需要从文本中检测并屏蔽微信ID和手机号码，以防止个人信息泄露。本程序旨在实现这一功能。

### 2. 关键字检测

程序首先定义了一系列与微信相关的关键字，如“微信”、“WeChat”、“VX”等。通过遍历这些关键字，程序可以检测文本中是否包含这些关键字。

### 3. 正则表达式匹配

程序使用了两个正则表达式来匹配手机号码和微信ID。手机号码的正则表达式匹配11位数字，以1开头，第二位是2到9之间的数字。微信ID的正则表达式则匹配以字母或下划线开头的6到20个字符，由字母、数字、下划线组成。

### 4. 检测与屏蔽

程序使用`Pattern`​和`Matcher`​类来查找文本中的手机号码和微信ID。一旦找到匹配项，程序会将其替换为星号，以屏蔽这些信息。

### 5. 结果输出

程序将检测到的关键字、手机号码和微信ID存储在`DetectionResult`​对象中，并提供原始文本和屏蔽后的文本。最后，程序打印出每个测试用例的检测结果。

### 6. 示例代码

以下是程序的核心部分代码：

```java
public class WxAndPhoneDetector {

    
    public static void main(String[] args) {
        // 测试用例数组
        String[] testCases = {
                "我的微信号是：WeChat123_456",
                "联系电话：13609086289，非工作时间也可以联系我。",
                "微信转账功能真的很方便。",
                "微信联系我：WeChat_123456，电话：13609086289，价格可以微信详谈。",
                "参考编号：WeChat123!!!!!! 价格：136090800，详情请联系。",
                "详情请参考产品手册。",
                "账号: WeChat_123456, 联系电话: 13609086289。",
                "如果你需要帮助，可以联系我的微信号：wEcHaT_123456，或者手机：13609086289。",
                "紧急联系电话：+8613609086289 或者 136-0908-6289。",
                "微信号列表：WeChat_1, WeChat_2, 联系电话：136090800, 1391234567。"
        };

        // 遍历测试用例
        for (String text : testCases) {
            DetectionResult result = detectKeywordsAndWeChatIDAndMobile(text);
            System.out.println("测试用例文本: " + text);
            System.out.println("检测结果: " + result);
            System.out.println();
        }
    }

    /**
     * 检测文本中是否包含指定的关键字、合法的微信号和手机号码，并返回检测结果。
     *
     * @param text 需要检测的文本
     * @return 返回包含检测结果的对象
     */
    public static DetectionResult detectKeywordsAndWeChatIDAndMobile(String text) {
        DetectionResult result = new DetectionResult();
        result.originalText = text; // 保存原始文本
        result.containsKeyword = false; // 初始化关键字标志为false

        // 定义需要检测的关键字
        String[] keywords = {"微信", "Wx", "wx", "WX", "WeChat", "wechat", "Weixin", "weixin", "VX", "vx", "Vx", "vX", "QQ", "qq", "Qq", "qQ", "电话", "手机", "联系方式", "联系电话", "联系手机", "联系QQ", "联系微信"};

        // 检测关键字
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                result.containsKeyword = true;
                result.keywordsFound.add(keyword);
            }
        }

        // 正则表达式，匹配11位手机号码。
        String mobileRegex = "1[3-9]\\d{9}";

        // 正则表达式，匹配以字母或下划线开头的6到20个字符，由字母、数字、下划线组成
        String weChatIDRegex = "[a-zA-Z_][a-zA-Z0-9_]{5,18}";

        // 使用Pattern和Matcher检测手机号码
        Pattern mobilePattern = Pattern.compile(mobileRegex);
        Matcher mobileMatcher = mobilePattern.matcher(text);

        // 查找并替换所有匹配的手机号码为星号
        StringBuffer buffer = new StringBuffer();
        while (mobileMatcher.find()) {
            String mobile = mobileMatcher.group();
            result.mobileNumbersFound.add(mobile);
        }
        mobileMatcher.appendTail(buffer); // 添加未匹配的部分
        String textAfterMobileReplacement = buffer.toString(); // 保存屏蔽手机号码后的文本

        // 使用Pattern和Matcher检测微信号
        Pattern weChatPattern = Pattern.compile(weChatIDRegex);
        Matcher weChatMatcher = weChatPattern.matcher(textAfterMobileReplacement);

        buffer = new StringBuffer(textAfterMobileReplacement);
        while (weChatMatcher.find()) {
            String weChatID = weChatMatcher.group();
            result.wechatIDsFound.add(weChatID);
        }
        weChatMatcher.appendTail(buffer); // 添加未匹配的部分
        // 根据已匹配的手机号码和微信号码，替换所有匹配的手机号码和微信号码为星号
        result.maskedText = text.replaceAll(mobileRegex, "****").replaceAll(weChatIDRegex, "****"); // 保存屏蔽手机号码和微信号码后的文本

        return result;
    }

    /**
     * 封装检测结果的类。
     */
    public static class DetectionResult {
        List<String> keywordsFound = new ArrayList<>();
        List<String> wechatIDsFound = new ArrayList<>();
        List<String> mobileNumbersFound = new ArrayList<>();
        boolean containsKeyword = false; // 是否包含关键字
        String originalText; // 原始文本
        String maskedText; // 屏蔽微信号和手机号码后的文本

        @Override
        public String toString() {
            return "是否包含关键字: " + containsKeyword +
                    ", 关键字列表: [" + String.join(", ", keywordsFound) + "]" +
                    ", 微信号列表: [" + String.join(", ", wechatIDsFound) + "]" +
                    ", 手机号码列表: [" + String.join(", ", mobileNumbersFound) + "]" +
                    "\n" +
                    "原始文本: \"" + originalText + "\"" +
                    "\n" +
                    "屏蔽后的文本: \"" + maskedText + "\"";
        }
    }
}
```

```sh
测试用例文本: 我的微信号是：WeChat123_456
检测结果: 是否包含关键字: true, 关键字列表: [微信, WeChat], 微信号列表: [WeChat123_456], 手机号码列表: []
原始文本: "我的微信号是：WeChat123_456"
屏蔽后的文本: "我的微信号是：****"

测试用例文本: 联系电话：13609086289，非工作时间也可以联系我。
检测结果: 是否包含关键字: true, 关键字列表: [电话, 联系电话], 微信号列表: [], 手机号码列表: [13609086289]
原始文本: "联系电话：13609086289，非工作时间也可以联系我。"
屏蔽后的文本: "联系电话：****，非工作时间也可以联系我。"

测试用例文本: 微信转账功能真的很方便。
检测结果: 是否包含关键字: true, 关键字列表: [微信], 微信号列表: [], 手机号码列表: []
原始文本: "微信转账功能真的很方便。"
屏蔽后的文本: "微信转账功能真的很方便。"

测试用例文本: 微信联系我：WeChat_123456，电话：13609086289，价格可以微信详谈。
检测结果: 是否包含关键字: true, 关键字列表: [微信, WeChat, 电话], 微信号列表: [WeChat_123456], 手机号码列表: [13609086289]
原始文本: "微信联系我：WeChat_123456，电话：13609086289，价格可以微信详谈。"
屏蔽后的文本: "微信联系我：****，电话：****，价格可以微信详谈。"

测试用例文本: 参考编号：WeChat123!!!!!! 价格：136090800，详情请联系。
检测结果: 是否包含关键字: true, 关键字列表: [WeChat], 微信号列表: [WeChat123], 手机号码列表: []
原始文本: "参考编号：WeChat123!!!!!! 价格：136090800，详情请联系。"
屏蔽后的文本: "参考编号：****!!!!!! 价格：136090800，详情请联系。"

测试用例文本: 详情请参考产品手册。
检测结果: 是否包含关键字: false, 关键字列表: [], 微信号列表: [], 手机号码列表: []
原始文本: "详情请参考产品手册。"
屏蔽后的文本: "详情请参考产品手册。"

测试用例文本: 账号: WeChat_123456, 联系电话: 13609086289。
检测结果: 是否包含关键字: true, 关键字列表: [WeChat, 电话, 联系电话], 微信号列表: [WeChat_123456], 手机号码列表: [13609086289]
原始文本: "账号: WeChat_123456, 联系电话: 13609086289。"
屏蔽后的文本: "账号: ****, 联系电话: ****。"

测试用例文本: 如果你需要帮助，可以联系我的微信号：wEcHaT_123456，或者手机：13609086289。
检测结果: 是否包含关键字: true, 关键字列表: [微信, 手机], 微信号列表: [wEcHaT_123456], 手机号码列表: [13609086289]
原始文本: "如果你需要帮助，可以联系我的微信号：wEcHaT_123456，或者手机：13609086289。"
屏蔽后的文本: "如果你需要帮助，可以联系我的微信号：****，或者手机：****。"

测试用例文本: 紧急联系电话：+8613609086289 或者 136-0908-6289。
检测结果: 是否包含关键字: true, 关键字列表: [电话, 联系电话], 微信号列表: [], 手机号码列表: [13609086289]
原始文本: "紧急联系电话：+8613609086289 或者 136-0908-6289。"
屏蔽后的文本: "紧急联系电话：+86**** 或者 136-0908-6289。"

测试用例文本: 微信号列表：WeChat_1, WeChat_2, 联系电话：136090800, 1391234567。
检测结果: 是否包含关键字: true, 关键字列表: [微信, WeChat, 电话, 联系电话], 微信号列表: [WeChat_1, WeChat_2], 手机号码列表: []
原始文本: "微信号列表：WeChat_1, WeChat_2, 联系电话：136090800, 1391234567。"
屏蔽后的文本: "微信号列表：****, ****, 联系电话：136090800, 1391234567。"
```

### 7. 结论

本文介绍的Java程序能够有效地检测和屏蔽文本中的微信ID和手机号码，有助于保护用户的隐私信息。通过使用正则表达式和字符串处理技术，程序能够灵活地适应不同的检测需求。

### 8. 未来工作

未来的工作可以包括扩展关键字列表，优化正则表达式以提高匹配准确性，以及增加对其他社交媒体ID的检测支持。

---

本文提供了一个简单的Java程序，用于检测和屏蔽文本中的微信ID和手机号码。程序的设计考虑了隐私保护的需求，并展示了如何使用Java的正则表达式API来实现复杂的文本处理任务。
