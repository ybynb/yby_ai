package com.yupi.yuaicodemother.saver;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.yupi.yuaicodemother.ai.model.HtmlCodeResult;
import com.yupi.yuaicodemother.exception.BusinessException;
import com.yupi.yuaicodemother.exception.ErrorCode;
import com.yupi.yuaicodemother.model.enums.CodeGenTypeEnum;
import org.aspectj.apache.bcel.classfile.Code;

import java.io.File;
import java.nio.charset.StandardCharsets;

public abstract class CodeFileSaverTemplate<T> {
    /**
     * 文件保存目录
     */
    private static final String FILE_SAVE_ROOT_DIR =System.getProperty("user.dir")+"/tmp/code_output/";

    /**
     * 模板方法：保存代码的标准流程
     * @param result 代码结果对象
     * @return 保存目录
     */
    public final File saveCode(T result){
        //1 验证参数
        validateInput(result);
        //2 构建唯一目录
        String baseDirPath = buildUniqueDirPath();
        //3 保存文件（具体实现子类体现）
        saveFiles(result,baseDirPath);
        //4 返回目录文件对象
        return new File(baseDirPath);
    }

    /**
     * 验证输入参数
     * @param result
     */
    protected  void validateInput(T result){
        if(result == null){
            throw new BusinessException(ErrorCode.PARAMS_ERROR,"代码结果对象不能为空");
        }
    }
    /**
     * 构建唯一目录路径
     *
     * @return目录路径
     */
    private  String buildUniqueDirPath() {
        String codeType = getCodeType().getValue();
        String uniqueDirName = StrUtil.format("{}_{}", codeType, IdUtil.getSnowflakeNextIdStr());
        String dirPath = FILE_SAVE_ROOT_DIR + java.io.File.separator + uniqueDirName;
        FileUtil.mkdir(dirPath);
        return dirPath;
    }

    /**
     * 写入单个文件
     */
    public static void writeToFile(String dirPath, String fileName,String content) {
        if(StrUtil.isNotBlank(content)){
            String filePath = dirPath + java.io.File.separator + fileName;
            FileUtil.writeString(content,filePath, StandardCharsets.UTF_8);
        }

    }

    /**
     * 获取代码类型（子类实现）
     * @return
     */
    protected abstract CodeGenTypeEnum getCodeType();

    /**
     * 保存文件的具体实现（子类实现）
     * @param result        代码结果对象
     * @param baseDirPath   基础目录路径
     */
    protected abstract void saveFiles(T result,String baseDirPath);
}
