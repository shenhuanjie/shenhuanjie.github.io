---
title: 关于分页获取评论回复的实现
date: '2024-02-21 18:23:01'
updated: '2024-02-21 18:30:39'
permalink: >-
  /post/regarding-the-implementation-of-pagination-obtaining-comment-reply-1mdrmn.html
comments: true
toc: true
---

# 关于分页获取评论回复的实现

> 在一些评论列表存在回复情况下，如何构建返回的数据呢？下面是简单的实现逻辑。

```java
  /**
     * 获取聊天频道话题评论列表
     *
     * @param channelId   频道id
     * @param userId      用户id
     * @param pageCurrent 当前页
     * @param pageSize    每页条数
     * @return {@link List < InstantChatChannelCommentVo >} 聊天频道话题评论列表
     * @throws Exception 异常
     * @author shenhuanjie
     * @version v2.3.0
     * @since 2024/2/21 14:42
     */
    @Override
    public List<InstantChatChannelCommentVo> getInstantChatChannelCommentList(String channelId, String userId, Integer pageCurrent, Integer pageSize) throws InvocationTargetException, IllegalAccessException {
        if (StringUtils.isEmpty(channelId)) {
            throw new IllegalArgumentException("频道id不能为空");
        }
        PlatInstantChatChannelEntity channel = platInstantChatChannelService.getInstantChatChannelDetail(channelId);
        if (channel == null) {
            throw new RuntimeException("频道不存在");
        }
        // 校验频道类型
        String channelType = channel.getChannelType();
        if (StringUtils.isEmpty(channelType)) {
            throw new RuntimeException("频道类型不能为空");
        }
        if (!channelType.equals(InstantChatChannelTypeEnum.COMMENT_CHANNEL.getCode())) {
            throw new RuntimeException("该频道不支持评论");
        }
        // 获取频道评论列表
        List<PlatInstantChatChannelCommentEntity> commentList = this.getInstantsChatChannelCommentList(channelId, pageCurrent, pageSize);
        // 频道评论列表 IDS 集合
        List<String> commentIds = commentList.stream().map(PlatInstantChatChannelCommentEntity::getId).collect(Collectors.toList());
        // 获取频道评论回复列表
        List<PlatInstantChatChannelCommentEntity> replyList = this.getInstantsChatChannelCommentReplyList(commentIds);

        Map<String, InstantChatChannelCommentVo> commentTreeMap = new TreeMap<>();

        for (PlatInstantChatChannelCommentEntity comment : commentList) {
            InstantChatChannelCommentVo vo = new InstantChatChannelCommentVo();
            BeanUtils.copyProperties(vo, comment);
            commentTreeMap.put(comment.getId(), vo);
        }

        for (PlatInstantChatChannelCommentEntity reply : replyList) {
            String parentId = reply.getParentId();
            if (StringUtils.isEmpty(parentId)) {
                continue;
            }
            if (!commentTreeMap.containsKey(parentId)) {
                continue;
            }
            List<InstantChatChannelCommentVo> parentReplyList = commentTreeMap.get(parentId).getReplyList();
            if (parentReplyList == null) {
                parentReplyList = new ArrayList<>();
                commentTreeMap.get(parentId).setReplyList(parentReplyList);
            }
            InstantChatChannelCommentVo vo = new InstantChatChannelCommentVo();
            BeanUtils.copyProperties(vo, reply);
            commentTreeMap.get(parentId).getReplyList().add(vo);
        }
        List<InstantChatChannelCommentVo> commentVos = new ArrayList<>(commentTreeMap.values());
        // 按照评论时间倒序排序
        commentVos.sort(Comparator.comparing(InstantChatChannelCommentVo::getCreateTime).reversed());
        return commentVos;
    }
```

1. 首先分页获取评论列表
2. 根据评论列表 ID 集合获取关联的回复列表（这里可以根据实际情况返回条数或做分页，后续异步获取更多回复记录，此处直接获取所有回复记录）
3. 构造 TreeMap 存放评论记录
4. 遍历评论记录，构建评论、回复二级树
5. 将 TreeMap 转为 List 返回（这里按实际情况处理）

以上步骤可能有点冗余，可视实际情况优化。

<span style="font-weight: bold;" data-type="strong">END</span>
