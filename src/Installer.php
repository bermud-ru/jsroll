<?php
namespace MyProject;
use ComposerScriptEvent;

class Installer
{
    public static function preInstall(Event $event) {
        // provides access to the current ComposerIOConsoleIO
        // stream for terminal input/output
        $io = $event->getIO();
        if ($io->askConfirmation("Are you sure you want to proceed? ", false)) {
            // ok, continue on to composer install
            return true;
        }
        // exit composer and terminate installation process
        exit;
    }

    public static function postInstall(Event $event) {
        // provides access to the current Composer instance
        $composer = $event->getComposer();
        // run any post install tasks here
    }

    public static function postPackageInstall(Event $event) {
        $installedPackage = $event->getComposer()->getPackage();
        // any tasks to run after the package is installed?
    }
}
?>