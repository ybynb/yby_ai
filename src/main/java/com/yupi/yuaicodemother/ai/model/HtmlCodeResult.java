package com.yupi.yuaicodemother.ai.model;

import jdk.jfr.Description;
import lombok.Data;

@Description("生成html代码文件结果")
@Data
public class HtmlCodeResult {
    /**
     * html代码
     */
    @Description("html代码")
    private String htmlCode;
    /**
     * 描述
     */
    @Description("描述")
    private String description;
}
