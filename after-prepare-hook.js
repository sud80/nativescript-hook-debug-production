var path = require("path");
var fs = require('fs');
function getPlatformsData($injector) {
    try {
        return $injector.resolve("platformsData");
    } catch (err) {
        return $injector.resolve("platformsDataService");
    }
}

module.exports = function ($logger, $projectData, $injector, hookArgs) {
        var logger = $logger; 
        var projectData = $projectData;
        var platformsData = getPlatformsData($injector);

	return new Promise(function(resolve, reject) {

		var release;
	
		var projectDir = projectData.projectDir;
	        const platform = hookArgs.prepareData.platform;	
		var platformData = platformsData.getPlatformData(platform);
		var platformOutDir = platformData.appDestinationDirectoryPath;
		var platformAppDir = path.join(platformOutDir, "app");

		try{
			if (
				projectData.$options.argv.production &&
				projectData.$options.argv.production === true
			) {
                		release = projectData.$options.argv.production;
            		} else if (
				projectData.$options.argv.release && 
				projectData.$options.argv.release === true
			) {
				release = projectData.$options.argv.release;
			} else if (
				hookArgs.$arguments.length >= 1 &&
				hookArgs.$arguments[1].prepareInfo &&
				hookArgs.$arguments[1].prepareInfo.release && 
				hookArgs.$arguments[1].prepareInfo.release === true
			) {
				release = hookArgs.$arguments[1].prepareInfo.release;
			} else {
				release = false;
				logger.error("Cannot resolve build type defaulting to false");
			}
		}catch(e){
			logger.error("Cannot resolve build type");
			reject(e);
		}
		logger.info("\nPlatform: " + platform +", Production mode: " + release + "\n");

		var keepFiles="debug";
		var deleteFiles="production";
		if(release){
			keepFiles="production";
			deleteFiles="debug";
		}
		
		try{
			walkSync(platformAppDir,keepFiles,deleteFiles,logger);
		}catch(e){
			logger.warn(e);
			logger.warn('Debug/Production hook failed while traversing and processing \'App folder\'.');
		}
		resolve();
    });
	

};


var walkSync = function(dir,toKeep,toDelete,logger) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    files.forEach(function(file) {
		if(file === "tns_modules") return;
		else if (fs.statSync(path.join(dir , file)).isDirectory()) {
			walkSync(path.join(dir , file),toKeep,toDelete,logger);
        	}
        	else { 
			processFiles(dir,file,toKeep,toDelete,logger);
		}
    });

};


var processFiles = function(dir,file,toKeep,toDelete,logger){
	if(file.indexOf("." + toKeep + "." ) > -1){
                var toKeepPath = path.join(dir , file).replace("." + toKeep + ".",".");
                if (fs.existsSync(toKeepPath)) {
			fs.unlinkSync(path.join(dir , file).replace("." + toKeep + ".","."));
		}
		try{
			fs.renameSync(path.join(dir , file),path.join(dir , file).replace("." + toKeep + ".","."));
		}catch(e){
			logger.warn(e);
		}
	}else if(file.indexOf( "." + toDelete + "." ) > -1){
		try{
			fs.unlinkSync(path.join(dir , file));
		}catch(e){
			logger.warn(e);
		}
	}
};

function getFiles(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
	  return fs.statSync(path.join(srcpath, file)).isFile();
  });
}
