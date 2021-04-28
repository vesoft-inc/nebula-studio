cmake_minimum_required(VERSION 3.15)
project("Nebula Graph Studio")
# package name
set(CPACK_PACKAGE_NAME "nebula graph studio")
set(CPACK_RPM_PACKAGE_ARCHITECTURE "x86_64")
set(CPACK_RPM_PACKAGE_RELEASE 1)
# user define install dir ON
# set(CPACK_SET_DESTDIR ON)
set(CPACK_RPM_PACKAGE_RELOCATABLE ON)
# default install path
set(CPACK_INSTALL_PREFIX "/usr/local/nebula-graph-studio")
# package version
set(CPACK_PACKAGE_VERSION "2.2.1")
set(CPACK_PACKAGE_FILE_NAME ${CPACK_PACKAGE_NAME}-${CPACK_PACKAGE_VERSION}-${CPACK_RPM_PACKAGE_RELEASE}.${CPACK_RPM_PACKAGE_ARCHITECTURE})
set(CPACK_PACKAGE_CHECKSUM SHA256)
# group name
set(CPACK_RPM_PACKAGE_GROUP "vesoft")
# vendor name
set(CPACK_PACKAGE_VENDOR "vesoft inc")
set(CPACK_RPM_PACKAGE_LICENSE "Apache 2.0 + Common Clause 1.0")

set(CPACK_RPM_PRE_INSTALL_SCRIPT_FILE ${CMAKE_CURRENT_SOURCE_DIR}/scripts/preinst.sh)
set(CPACK_RPM_POST_INSTALL_SCRIPT_FILE ${CMAKE_CURRENT_SOURCE_DIR}/scripts/postinst.sh)
set(CPACK_RPM_PRE_UNINSTALL_SCRIPT_FILE ${CMAKE_CURRENT_SOURCE_DIR}/scripts/prerm.sh)
set(CPACK_RPM_POST_UNINSTALL_SCRIPT_FILE ${CMAKE_CURRENT_SOURCE_DIR}/scripts/postrm.sh)

set(CPACK_RPM_EXCLUDE_FROM_AUTO_FILELIST_ADDITION "/usr/local")

# DEB
set(CPACK_PACKAGE_CONTACT "https://discuss.nebula-graph.com.cn/")

include(CPack)

# 添加一个名为 NebulaGraphStudio 的 component
cpack_add_component(NebulaGraphStduio
    DISPLAY_NAME  "Nebula Graph Studio"
    DESCRIPTION   "The Web App For Nebula"
    GROUP NebulaGraphStduioGroup)

cpack_add_component_group(NebulaGraphStudioGroup)

install(
	DIRECTORY
		./
	DESTINATION
		${CPACK_INSTALL_PREFIX}
	COMPONENT
		NebulaGraphStudio
        PATTERN "app/assets/components" EXCLUDE
        PATTERN "app/assets/config" EXCLUDE
        PATTERN "app/assets/context" EXCLUDE
        PATTERN "app/assets/modules" EXCLUDE
        PATTERN "app/assets/store" EXCLUDE
        PATTERN "app/assets/utils" EXCLUDE
	PATTERN "docs" EXCLUDE
	PATTERN "docs/*" EXCLUDE
	PATTERN ".git" EXCLUDE
	PATTERN ".git/*" EXCLUDE
	PATTERN "docker" EXCLUDE
	PATTERN "docker/*" EXCLUDE
	PATTERN "logs" EXCLUDE
	PATTERN "logs/*" EXCLUDE
	PATTERN "tmp/*" EXCLUDE
	PATTERN "nebula-go-api" EXCLUDE
	PATTERN "nebula-go-api/*" EXCLUDE
	PATTERN ".github" EXCLUDE
	PATTERN ".github/*" EXCLUDE
	PATTERN ".gitignore" EXCLUDE
	PATTERN "node_modules" EXCLUDE
	PATTERN "node_modules/*" EXCLUDE
)
