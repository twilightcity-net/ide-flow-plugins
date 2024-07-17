package net.twilightcity.flow.action.data;

public class FileActivityActionContext {
	String module;
	String filePath;
	Integer duration;

	public String getModule() {
		return module;
	}

	public String getFilePath() {
		return filePath;
	}

	public Integer getDuration() {
		return duration;
	}

	public void setModule(String module) {
		this.module = module;
	}

	public void setFilePath(String filePath) {
		this.filePath = filePath;
	}

	public void setDuration(Integer duration) {
		this.duration = duration;
	}
}
