/**
 * HTTP工具函数模块
 *
 * 提供简化的HTTP请求方法，封装了fetch API的常用操作。
 * 自动处理JSON序列化和错误处理。
 */

/**
 * 发送GET请求并解析JSON响应
 *
 * @param url - 请求的URL地址
 * @returns 解析后的JSON数据，类型为泛型T
 * @throws 如果请求失败或响应状态码不是2xx，抛出包含错误信息的异常
 *
 * @example
 * ```typescript
 * interface User { id: string; name: string }
 * const user = await getJson<User>('/api/user/123');
 * ```
 */
export async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const response = await fetch(url, { headers })

  // 检查响应状态码
  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `GET请求失败: ${url} - HTTP ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  // 解析并返回JSON数据
  return (await response.json()) as T
}

/**
 * 发送POST请求并解析JSON响应
 *
 * @param url - 请求的URL地址
 * @param body - 要发送的数据对象（会被自动序列化为JSON）
 * @returns 解析后的JSON数据，类型为泛型T
 * @throws 如果请求失败或响应状态码不是2xx，抛出包含错误信息的异常
 *
 * @example
 * ```typescript
 * interface CreateUserRequest { name: string; email: string }
 * interface CreateUserResponse { id: string; name: string }
 *
 * const newUser = await postJson<CreateUserResponse>('/api/users', {
 *   name: '张三',
 *   email: 'zhangsan@example.com'
 * });
 * ```
 */
export async function postJson<T>(
  url: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify(body),
  })

  // 检查响应状态码
  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `POST请求失败: ${url} - HTTP ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  // 解析并返回JSON数据
  return (await response.json()) as T
}
