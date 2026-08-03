package com.yupi.yuaicodemother.saver;

import com.yupi.yuaicodemother.ai.model.HtmlCodeResult;
import com.yupi.yuaicodemother.ai.model.MultiFileResult;
import com.yupi.yuaicodemother.exception.BusinessException;
import com.yupi.yuaicodemother.exception.ErrorCode;
import com.yupi.yuaicodemother.model.enums.CodeGenTypeEnum;


import java.io.File;

/**
 * 代码保存执行器
 */
public class CodeFileSaverExecutor {
    private static final HtmlCodeFileSaverTemplate htmlCodeFileSaverTemplate = new HtmlCodeFileSaverTemplate();
    private static final MultiFileCodeSaverTemplate multiFileCodeSaverTemplate = new MultiFileCodeSaverTemplate();
    /**
     *执行代码保存
     * @param codeResult         代码结果对象
     * @param codeGenTypeEnum    代码生成类型
     * @return
     */
    public static File executorSaver(Object codeResult, CodeGenTypeEnum codeGenTypeEnum,Long appid) {
        return switch (codeGenTypeEnum){
            case HTML -> htmlCodeFileSaverTemplate.saveCode((HtmlCodeResult) codeResult,appid);
            case MULTI_FILE -> multiFileCodeSaverTemplate.saveCode((MultiFileResult) codeResult,appid);
            default ->throw new BusinessException(ErrorCode.SYSTEM_ERROR,"不支持的代码生成类型："+codeGenTypeEnum);
        };
    }
}
