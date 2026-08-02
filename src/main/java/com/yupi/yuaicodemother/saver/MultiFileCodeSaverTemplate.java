package com.yupi.yuaicodemother.saver;

import cn.hutool.core.util.StrUtil;
import com.yupi.yuaicodemother.ai.model.HtmlCodeResult;
import com.yupi.yuaicodemother.ai.model.MultiFileResult;
import com.yupi.yuaicodemother.exception.BusinessException;
import com.yupi.yuaicodemother.exception.ErrorCode;
import com.yupi.yuaicodemother.model.enums.CodeGenTypeEnum;

import java.io.File;

/**
 * 多文件代码保存模板
 */
public class MultiFileCodeSaverTemplate extends CodeFileSaverTemplate<MultiFileResult> {
    @Override
    protected CodeGenTypeEnum getCodeType() {
        return CodeGenTypeEnum.MULTI_FILE;
    }


    @Override
    protected void saveFiles(MultiFileResult result, String baseDirPath) {
        writeToFile(baseDirPath,"index.html",result.getHtmlCode());
        writeToFile(baseDirPath,"style.css",result.getCssCode());
        writeToFile(baseDirPath,"script.js",result.getJsCode());
    }

    @Override
    protected  void validateInput(MultiFileResult result){
       super.validateInput(result);
       //至少要有html代码
       if(StrUtil.isBlank(result.getHtmlCode())){
           throw new BusinessException(ErrorCode.PARAMS_ERROR,"Html代码结果对象不能为空");
       }
    }
}
