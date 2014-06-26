﻿<%@ Page Language="C#" AutoEventWireup="True" Inherits="ToSic.Eav.ManagementUI.Pages.EavManagement" StylesheetTheme="Dialog" Codebehind="EavManagement.aspx.cs" %>

<%@ Register src="Eav/Controls/EavManagement.ascx" tagname="EavManagement" tagprefix="Eav" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Eav Management</title>
    <script type="text/javascript" src="/Scripts/jquery-1.9.1.min.js"></script>
</head>
<body>
    <form id="form1" runat="server">
	<asp:ScriptManager runat="server" ID="ScriptManager1" />
	<%-- Optional use the BaseUrl-Property to specify a URL that this Wrapper Module will use --%>
	<Eav:EavManagement ID="EAVManagement1" runat="server" Scope="" DefaultCultureDimension="2" ZoneId="1" AppId="1" />
    <asp:Button ID="btnClearCache" runat="server" Text="Clear Cache" OnClick="btnClearCache_Click" style="position: absolute; bottom: 0; right: 0" />
    </form>
</body>
</html>