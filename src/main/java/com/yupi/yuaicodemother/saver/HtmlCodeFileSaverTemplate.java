package com.yupi.yuaicodemother.saver;

import cn.hutool.core.util.StrUtil;
import com.yupi.yuaicodemother.ai.model.HtmlCodeResult;
import com.yupi.yuaicodemother.exception.BusinessException;
import com.yupi.yuaicodemother.exception.ErrorCode;
import com.yupi.yuaicodemother.model.enums.CodeGenTypeEnum;

/**
 * html代码保存模板
 */
public class HtmlCodeFileSaverTemplate extends CodeFileSaverTemplate<HtmlCodeResult> {
    @Override
    protected CodeGenTypeEnum getCodeType() {
        return CodeGenTypeEnum.HTML;
    }

    @Override
    protected void saveFiles(HtmlCodeResult result, String baseDirPath) {
        writeToFile(baseDirPath, "index.html", result.getHtmlCode());
    }
    @Override
    protected  void validateInput(HtmlCodeResult result){
       super.validateInput(result);
       if(StrUtil.isBlank(result.getHtmlCode())){
           throw new BusinessException(ErrorCode.PARAMS_ERROR,"Html代码结果对象不能为空");
       }
    }
}
