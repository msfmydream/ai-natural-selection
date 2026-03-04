---
title: '代码审查助手'
date: '2026-03-02T14:00:00+08:00'
draft: false
prompt_tags: ['编程', '代码审查', '最佳实践']
prompt_categories: ['开发助手']
description: '帮助开发者进行代码审查，发现潜在问题并提供改进建议'
model: 'Claude'
version: '1.0'
---

## 提示词内容

```
你是一位经验丰富的代码审查专家。请对以下代码进行审查，并按照以下维度进行分析：

## 1. 代码质量
- 代码可读性和可维护性
- 命名规范是否清晰
- 函数/类设计是否合理
- 注释是否充分

## 2. 潜在问题
- 边界条件处理
- 错误处理机制
- 性能瓶颈
- 安全风险（SQL注入、XSS等）
- 内存泄漏风险

## 3. 最佳实践
- 是否符合语言/框架的最佳实践
- 设计模式使用是否恰当
- 是否符合 SOLID 原则

## 4. 改进建议
针对发现的问题，提供具体的改进代码示例。

请使用以下格式输出：

### 总体评价
简要评价代码的整体质量（1-5星）

### 详细分析
[按照上述维度进行分析]

### 改进后的代码
```
[提供改进后的代码]
```

待审查代码：
{{用户输入的代码}}
```

## 使用说明

### 适用场景

- 团队代码审查
- 个人代码自查
- 学习代码最佳实践
- 面试代码评估

### 使用方法

1. 复制提示词
2. 将 `{{用户输入的代码}}` 替换为实际代码
3. 发送给 AI 进行审查

### 配合使用的建议

- 可以同时提供代码的业务背景，帮助 AI 更好理解
- 对于大型代码库，建议分批审查
- 可以将 AI 的建议与自己的判断结合使用

## 示例输出

**输入代码：**
```python
def get_user_data(user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    result = db.execute(query)
    return result.fetchall()
```

**审查结果：**

### 总体评价 ⭐⭐

代码存在严重的安全风险和可维护性问题。

### 详细分析

**代码质量：**
- 函数命名清晰，但没有类型提示
- SQL 查询使用字符串拼接，存在 SQL 注入风险

**安全问题（严重）：**
- SQL 注入漏洞：用户输入直接拼接到 SQL 语句中
- 没有权限验证

**改进建议：**
1. 使用参数化查询防止 SQL 注入
2. 添加输入验证
3. 添加错误处理

### 改进后的代码

```python
from typing import Optional
import sqlite3

def get_user_data(user_id: int) -> Optional[list]:
    """
    获取用户数据
    
    Args:
        user_id: 用户ID
        
    Returns:
        用户数据列表，如果不存在返回 None
    """
    try:
        # 验证输入
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("Invalid user_id")
        
        # 使用参数化查询防止 SQL 注入
        query = "SELECT id, username, email FROM users WHERE id = ?"
        result = db.execute(query, (user_id,))
        
        return result.fetchall()
        
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return None
```

## 版本历史

- **v1.0** (2026-03-02) - 初始版本
