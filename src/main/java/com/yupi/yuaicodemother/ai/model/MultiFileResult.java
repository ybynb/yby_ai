package com.yupi.yuaicodemother.ai.model;

import jdk.jfr.Description;
import lombok.Data;

@Description("生成多个代码文件结果")
@Data
public class MultiFileResult {

    @Description("html代码")
    private String htmlCode;

    @Description("css代码")
    private String cssCode;

    @Description("js代码")
    private String jsCode;

    @Description("描述")
    private String description;
}
